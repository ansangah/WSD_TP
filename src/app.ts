import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import { requestLogger } from "./middlewares/request-logger";
import { errorHandler } from "./middlewares/error-handler";
import routes from "./routes";
import { prisma } from "./config/db";

const app = express();

app.use(cors());
// Allow external Swagger UI assets; keep other helmet protections.
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    code: "RATE_LIMITED",
    message: "Too many requests, please try again later.",
  },
});

app.use(limiter);
app.use(requestLogger);

const openApiPath = path.resolve(process.cwd(), "docs", "openapi.json");
const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
const swaggerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>GoGoStudy API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f5f5f5; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/docs.json",
        dom_id: "#swagger-ui"
      });
    </script>
  </body>
</html>`;

app.get("/health", (req, res) => {
  const pkgPath = path.resolve(process.cwd(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const buildTime = process.env.BUILD_TIME || process.env.VERCEL_BUILD_TIME || process.env.HEROKU_RELEASE_CREATED_AT;

  if (process.env.MAINTENANCE_MODE === "true") {
    res.status(503).json({
      status: "UNAVAILABLE",
      service: "GoGoStudy API",
      message: "Service is under maintenance",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    status: "OK",
    service: "GoGoStudy API",
    version: pkg.version,
    buildTime: buildTime || new Date().toISOString(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/docs.json", (_req, res) => {
  res.json(openApiSpec);
});

app.get("/docs", (_req, res) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self' https: data:",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "connect-src 'self' https://unpkg.com",
      "img-src 'self' data: https:",
      "font-src 'self' https: data:",
    ].join("; "),
  );
  res.type("html").send(swaggerHtml);
});

app.get("/", (_req, res) => {
  res.type("html").send(
    [
      "<!doctype html>",
      "<html>",
      "<head><meta charset=\"utf-8\"><title>GoGoStudy API</title></head>",
      "<body style=\"font-family: sans-serif; padding: 24px;\">",
      "<h1>GoGoStudy API</h1>",
      "<p>API 서버가 실행 중입니다.</p>",
      "<ul>",
      "<li><a href=\"/docs\">Swagger UI</a></li>",
      "<li><a href=\"/docs.json\">OpenAPI JSON</a></li>",
      "<li><a href=\"/health\">Health Check</a></li>",
      "</ul>",
      "</body>",
      "</html>",
    ].join(""),
  );
});

app.use("/", routes);

app.use(errorHandler);

export default app;
