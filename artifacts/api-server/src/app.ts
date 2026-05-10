import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env["NODE_ENV"] === "production") {
  const staticPath = resolve(__dirname, "../../../artifacts/downloader-ui/dist/public");
  if (existsSync(staticPath)) {
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(resolve(staticPath, "index.html"));
    });
    logger.info({ staticPath }, "Serving static React app");
  } else {
    logger.warn({ staticPath }, "Static build not found — skipping static serving");
  }
}

export default app;
