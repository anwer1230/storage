import { Router } from "express";
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { GetFormatsQueryParams } from "@workspace/api-zod";

const router = Router();

const YT_DLP = process.env["YT_DLP_PATH"] ?? "yt-dlp";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "Unknown";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(YT_DLP, args, { env: { ...process.env } });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

router.get("/formats", async (req, res) => {
  const parsed = GetFormatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "url parameter is required" });
    return;
  }

  const { url } = parsed.data;

  try {
    const raw = await runYtDlp([
      "--dump-json",
      "--no-playlist",
      url,
    ]);

    const info = JSON.parse(raw) as {
      title: string;
      thumbnail?: string;
      duration?: number;
      formats?: Array<{
        format_id: string;
        ext: string;
        filesize?: number;
        filesize_approx?: number;
        height?: number;
        width?: number;
        vcodec?: string;
        acodec?: string;
        format_note?: string;
        tbr?: number;
      }>;
    };

    const rawFormats = info.formats ?? [];

    type FmtEntry = {
      formatId: string;
      label: string;
      size: string;
      sizeBytes: number;
      type: "combined" | "merged" | "audio";
    };

    const result: FmtEntry[] = [];

    const heights = [2160, 1440, 1080, 720, 480, 360, 240, 144];

    for (const h of heights) {
      const videoFmt = rawFormats
        .filter((f) => f.height === h && f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none")
        .sort((a, b) => (b.filesize ?? b.filesize_approx ?? 0) - (a.filesize ?? a.filesize_approx ?? 0))[0];

      if (videoFmt) {
        const bytes = videoFmt.filesize ?? videoFmt.filesize_approx ?? 0;
        result.push({
          formatId: videoFmt.format_id,
          label: `${h}p (${videoFmt.ext.toUpperCase()})`,
          size: formatBytes(bytes),
          sizeBytes: bytes,
          type: "combined",
        });
      }
    }

    for (const h of heights) {
      const videoOnly = rawFormats
        .filter((f) => f.height === h && f.vcodec && f.vcodec !== "none" && (!f.acodec || f.acodec === "none"))
        .sort((a, b) => (b.filesize ?? b.filesize_approx ?? 0) - (a.filesize ?? a.filesize_approx ?? 0))[0];

      const audioFmt = rawFormats
        .filter((f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none")
        .sort((a, b) => (b.filesize ?? b.filesize_approx ?? 0) - (a.filesize ?? a.filesize_approx ?? 0))[0];

      if (videoOnly) {
        const vBytes = videoOnly.filesize ?? videoOnly.filesize_approx ?? 0;
        const aBytes = audioFmt ? (audioFmt.filesize ?? audioFmt.filesize_approx ?? 0) : 0;
        const totalBytes = vBytes + aBytes;
        result.push({
          formatId: `${videoOnly.format_id}+${audioFmt ? audioFmt.format_id : "bestaudio"}`,
          label: `${h}p HD (${videoOnly.ext.toUpperCase()}+audio)`,
          size: formatBytes(totalBytes),
          sizeBytes: totalBytes,
          type: "merged",
        });
      }
    }

    const audioBest = rawFormats
      .filter((f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none")
      .sort((a, b) => (b.filesize ?? b.filesize_approx ?? 0) - (a.filesize ?? a.filesize_approx ?? 0))[0];

    if (audioBest) {
      const bytes = audioBest.filesize ?? audioBest.filesize_approx ?? 0;
      result.push({
        formatId: audioBest.format_id,
        label: `Audio only (${audioBest.ext.toUpperCase()})`,
        size: formatBytes(bytes),
        sizeBytes: bytes,
        type: "audio",
      });
    }

    if (result.length === 0 && rawFormats.length > 0) {
      const best = rawFormats[rawFormats.length - 1];
      const bytes = best.filesize ?? best.filesize_approx ?? 0;
      result.push({
        formatId: best.format_id,
        label: `Best (${best.ext.toUpperCase()})`,
        size: formatBytes(bytes),
        sizeBytes: bytes,
        type: "combined",
      });
    }

    res.json({
      title: info.title ?? "Video",
      thumbnail: info.thumbnail ?? null,
      duration: info.duration ?? null,
      formats: result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log?.error({ err }, "Failed to fetch formats");
    res.status(422).json({ error: `Could not extract video info: ${msg.slice(0, 200)}` });
  }
});

router.get("/download", async (req, res) => {
  const { url, formatId } = req.query as { url?: string; formatId?: string };

  if (!url || !formatId) {
    res.status(400).json({ error: "url and formatId are required" });
    return;
  }

  const tmpDir = path.join(os.tmpdir(), "yt-dlp-downloads");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const outTemplate = path.join(tmpDir, `%(title)s.%(ext)s`);

  const args = [
    "--format", formatId,
    "--no-playlist",
    "--merge-output-format", "mp4",
    "--output", outTemplate,
    "--print", "after_move:filepath",
    "--no-progress",
    url,
  ];

  try {
    const outputPath = (await runYtDlp(args)).trim();

    if (!outputPath || !existsSync(outputPath)) {
      res.status(500).json({ error: "Download failed: output file not found" });
      return;
    }

    const filename = path.basename(outputPath);
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/"/g, '\\"')}"`);
    res.setHeader("Content-Type", "video/mp4");

    const { createReadStream } = await import("node:fs");
    const stream = createReadStream(outputPath);
    stream.pipe(res);

    stream.on("close", async () => {
      try { await unlink(outputPath); } catch {}
    });

    res.on("close", async () => {
      try { stream.destroy(); await unlink(outputPath); } catch {}
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log?.error({ err }, "Download failed");
    if (!res.headersSent) {
      res.status(500).json({ error: `Download failed: ${msg.slice(0, 200)}` });
    }
  }
});

export default router;
