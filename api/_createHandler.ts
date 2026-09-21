import express, { Request, Response } from "express";

export function createEndpoint(handlerFn: (req: Request, res: Response) => any) {
  const app = express();
  app.use(express.json());

  // CORS & Strict No-Cache for Vercel Serverless
  app.use((_req: Request, res: Response, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (_req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Handle all paths matching this serverless file directly
  app.all("*", (req: Request, res: Response) => {
    return handlerFn(req, res);
  });

  return (req: any, res: any) => app(req, res);
}
