import os
import glob
import asyncio
import yt_dlp
from pyrogram import Client, filters
from pyrogram.types import (
    Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
)

API_ID   = 22043994
API_HASH = "56f64582b363d367280db96586b97801"
BOT_TOKEN = "8631119369:AAGyCQ62tptJlumPX2Esm2XsukkUcWBjQfA"

DOWNLOAD_DIR = "bot/downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# تخزين مؤقت: {chat_id: {format_id: {url, info}}}
pending: dict = {}

app = Client("videobot", api_id=API_ID, api_hash=API_HASH, bot_token=BOT_TOKEN, in_memory=True)


# ─────────────────────────────────────────────
# أوامر البوت
# ─────────────────────────────────────────────

@app.on_message(filters.command("start"))
async def cmd_start(client: Client, msg: Message):
    await msg.reply_text(
        "مرحباً! أنا بوت تحميل الفيديوهات 🎬\n\n"
        "أرسل أي رابط فيديو وسأعرض لك الجودات مع الحجم.\n"
        "✅ لا توجد قيود على الحجم — يصل حتى 2 غيغابايت مباشرة داخل تيليغرام!\n\n"
        "المواقع المدعومة:\n"
        "• YouTube • Twitter/X • Facebook\n"
        "• Instagram • TikTok • وأكثر من 1000 موقع!"
    )


@app.on_message(filters.command("help"))
async def cmd_help(client: Client, msg: Message):
    await msg.reply_text(
        "📖 كيفية الاستخدام:\n\n"
        "1. أرسل رابط الفيديو\n"
        "2. اختر الجودة من الأزرار\n"
        "3. انتظر حتى يُرسل الفيديو مباشرة هنا\n\n"
        "✅ يدعم ملفات حتى 2 غيغابايت بدون روابط خارجية."
    )


# ─────────────────────────────────────────────
# مساعدات
# ─────────────────────────────────────────────

def format_size(b) -> str:
    if not b:
        return "؟"
    mb = b / (1024 * 1024)
    return f"{mb/1024:.2f} GB" if mb >= 1024 else f"{mb:.1f} MB"


def find_downloaded_file() -> str | None:
    exts = ("*.mp4", "*.mkv", "*.webm", "*.avi", "*.mov", "*.mp3", "*.m4a")
    files = []
    for ext in exts:
        files.extend(glob.glob(os.path.join(DOWNLOAD_DIR, ext)))
    if not files:
        return None
    files.sort(key=os.path.getmtime, reverse=True)
    return files[0]


def fetch_formats(url: str) -> tuple[str, list[dict]]:
    opts = {"quiet": True, "no_warnings": True, "noplaylist": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    title   = info.get("title", "فيديو")
    formats = info.get("formats", [])

    seen_heights = set()
    quality_list = []

    # ── جودات مدمجة (فيديو + صوت في ملف واحد) ──
    combined = sorted(
        [f for f in formats
         if f.get("vcodec") != "none" and f.get("acodec") != "none"
         and f.get("ext") in ("mp4", "webm")],
        key=lambda f: f.get("height") or 0, reverse=True
    )
    for fmt in combined:
        h = fmt.get("height")
        if h and h not in seen_heights:
            seen_heights.add(h)
            sz = fmt.get("filesize") or fmt.get("filesize_approx")
            quality_list.append({
                "format_id": fmt["format_id"],
                "label": f"🎬 {h}p",
                "size": format_size(sz),
                "size_bytes": sz or 0,
                "type": "combined",
            })

    # ── جودات عالية (فيديو منفصل + أفضل صوت مدمج) ──
    video_only = sorted(
        [f for f in formats
         if f.get("vcodec") != "none" and f.get("acodec") == "none"
         and f.get("ext") == "mp4"],
        key=lambda f: f.get("height") or 0, reverse=True
    )
    audio_list = [f for f in formats
                  if f.get("acodec") != "none" and f.get("vcodec") == "none"]
    best_audio_size = 0
    if audio_list:
        ba = max(audio_list, key=lambda f: f.get("abr") or 0)
        best_audio_size = ba.get("filesize") or ba.get("filesize_approx") or 0

    for fmt in video_only:
        h = fmt.get("height")
        if h and h not in seen_heights:
            seen_heights.add(h)
            vsz = fmt.get("filesize") or fmt.get("filesize_approx") or 0
            total = vsz + best_audio_size
            quality_list.append({
                "format_id": fmt["format_id"] + "+bestaudio",
                "label": f"⭐ {h}p HD",
                "size": format_size(total) if total else "؟",
                "size_bytes": total,
                "type": "merged",
            })

    # ── صوت فقط ──
    if audio_list:
        ba = max(audio_list, key=lambda f: f.get("abr") or 0)
        sz  = ba.get("filesize") or ba.get("filesize_approx")
        abr = ba.get("abr", "")
        quality_list.append({
            "format_id": "bestaudio",
            "label": f"🎵 صوت {int(abr)}kbps" if abr else "🎵 صوت فقط",
            "size": format_size(sz),
            "size_bytes": sz or 0,
            "type": "audio",
        })

    return title, quality_list


# ─────────────────────────────────────────────
# استقبال الروابط
# ─────────────────────────────────────────────

@app.on_message(filters.text & ~filters.command(["start", "help"]))
async def handle_url(client: Client, msg: Message):
    url = msg.text.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        await msg.reply_text("⚠️ يرجى إرسال رابط صحيح يبدأ بـ http:// أو https://")
        return

    status = await msg.reply_text("🔍 جاري جلب الجودات المتاحة...")

    try:
        loop = asyncio.get_event_loop()
        title, quality_list = await loop.run_in_executor(None, fetch_formats, url)

        if not quality_list:
            await status.edit_text("❌ لم يتم العثور على جودات لهذا الرابط.")
            return

        chat_id = msg.chat.id
        pending[chat_id] = {q["format_id"]: {"url": url, "info": q} for q in quality_list}

        buttons = [
            [InlineKeyboardButton(f"{q['label']}  —  {q['size']}", callback_data=f"dl:{q['format_id']}")]
            for q in quality_list
        ]
        short_title = title[:70] + "…" if len(title) > 70 else title
        await status.edit_text(
            f"🎬 **{short_title}**\n\nاختر الجودة المناسبة:",
            reply_markup=InlineKeyboardMarkup(buttons)
        )

    except yt_dlp.utils.DownloadError as e:
        err = str(e)
        if "Unsupported URL" in err:
            await status.edit_text("❌ هذا الرابط غير مدعوم.")
        elif "not available" in err.lower():
            await status.edit_text("❌ الفيديو غير متاح أو تم حذفه.")
        elif "Sign in" in err or "Private" in err:
            await status.edit_text("❌ الفيديو خاص ويتطلب تسجيل الدخول.")
        else:
            await status.edit_text(f"❌ خطأ:\n{err[:300]}")
    except Exception as e:
        await status.edit_text(f"❌ خطأ غير متوقع:\n{str(e)[:300]}")


# ─────────────────────────────────────────────
# تنفيذ التحميل بعد اختيار الجودة
# ─────────────────────────────────────────────

@app.on_callback_query(filters.regex(r"^dl:"))
async def handle_choice(client: Client, query: CallbackQuery):
    await query.answer()

    format_id = query.data[3:]
    chat_id   = query.message.chat.id

    if chat_id not in pending or format_id not in pending[chat_id]:
        await query.message.edit_text("❌ انتهت صلاحية الطلب. أرسل الرابط مجدداً.")
        return

    entry = pending[chat_id][format_id]
    url   = entry["url"]
    info  = entry["info"]

    await query.message.edit_text(
        f"⏳ جاري تحميل **{info['label']}** ({info['size']})…\nيرجى الانتظار."
    )

    # إعداد خيارات yt-dlp
    if info["type"] == "audio":
        ydl_opts = {
            "outtmpl": os.path.join(DOWNLOAD_DIR, "%(title).80s.%(ext)s"),
            "format": "bestaudio/best",
            "quiet": True, "no_warnings": True, "noplaylist": True,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
        }
    else:
        ydl_opts = {
            "outtmpl": os.path.join(DOWNLOAD_DIR, "%(title).80s.%(ext)s"),
            "format": format_id,
            "merge_output_format": "mp4",
            "quiet": True, "no_warnings": True, "noplaylist": True,
        }

    filename = None
    try:
        loop = asyncio.get_event_loop()

        def do_download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                dl_info = ydl.extract_info(url, download=True)
                return ydl.prepare_filename(dl_info)

        raw = await loop.run_in_executor(None, do_download)

        # تحديد الملف الفعلي
        if raw and os.path.exists(raw):
            filename = raw
        else:
            base = os.path.splitext(raw)[0] if raw else None
            for ext in (".mp4", ".mp3", ".mkv", ".webm", ".m4a"):
                cand = (base + ext) if base else None
                if cand and os.path.exists(cand):
                    filename = cand
                    break
            if not filename:
                filename = find_downloaded_file()

        if not filename or not os.path.exists(filename):
            await query.message.edit_text("❌ فشل التحميل، يرجى المحاولة مجدداً.")
            return

        file_size_mb = os.path.getsize(filename) / (1024 * 1024)

        await query.message.edit_text(
            f"📤 جاري الإرسال مباشرة ({file_size_mb:.1f} MB)…"
        )

        if info["type"] == "audio":
            await client.send_audio(
                chat_id=chat_id,
                audio=filename,
                caption="✅ تم التحميل بنجاح! 🎵",
            )
        else:
            await client.send_video(
                chat_id=chat_id,
                video=filename,
                caption=f"✅ {info['label']} — {file_size_mb:.1f} MB 🎬",
                supports_streaming=True,
            )

        await query.message.delete()

    except yt_dlp.utils.DownloadError as e:
        await query.message.edit_text(f"❌ فشل التحميل:\n{str(e)[:300]}")
    except Exception as e:
        await query.message.edit_text(f"❌ خطأ:\n{str(e)[:300]}")
    finally:
        if filename and os.path.exists(filename):
            try:
                os.remove(filename)
            except Exception:
                pass
        if chat_id in pending:
            del pending[chat_id]


# ─────────────────────────────────────────────
# تشغيل البوت
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("✅ البوت يعمل الآن — Pyrogram — حتى 2 GB مباشرة!")
    app.run()
