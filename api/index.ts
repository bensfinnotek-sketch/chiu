import express, { Request, Response } from "express";
import { createApiRouter } from "../src/server/apiRouter";

const app = express();

// Parse body payload
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enforce strict no-cache and CORS headers for every incoming request
app.use((req: Request, res: Response, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Normalize req.url so Express router always matches whether Vercel keeps or strips /api
  let pathOnly = (req.url || "/").split("?")[0];

  // If Vercel catch-all passed query.path as string or array
  if (req.query && req.query.path) {
    const segments = Array.isArray(req.query.path)
      ? req.query.path
      : [req.query.path];
    pathOnly = "/" + segments.join("/");
  }

  // Strip leading /api to standardize relative path
  const normalizedSubPath = pathOnly.startsWith("/api")
    ? pathOnly.substring(4)
    : pathOnly;

  const targetPath = normalizedSubPath.startsWith("/") ? normalizedSubPath : "/" + normalizedSubPath;
  const queryString = (req.url || "").includes("?") ? "?" + req.url.split("?")[1] : "";

  req.url = targetPath + queryString;

  next();
});

const router = createApiRouter();
// Mount router on both "/" and "/api" to be 100% resilient
app.use("/", router);
app.use("/api", router);

// Explicit 404 for unmatched API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
  });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
