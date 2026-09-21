import express from "express";
import { createApiRouter } from "../src/server/apiRouter";

const app = express();
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  next();
});

const router = createApiRouter();
app.use("/api", router);
app.use("/", router);

export default function handler(req: any, res: any) {
  return app(req, res);
}
