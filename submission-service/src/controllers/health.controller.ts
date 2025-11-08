import { Request, Response } from "express";

export const health = (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "submission-service", timestamp: new Date().toISOString() });
};
