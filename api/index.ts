import express from "express";
import { createApiRouter } from "../src/server/apiRouter";

const app = express();
app.use(express.json());

const router = createApiRouter();
app.use("/api", router);
app.use("/", router);

export default function handler(req: any, res: any) {
  return app(req, res);
}
