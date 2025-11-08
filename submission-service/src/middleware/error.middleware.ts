import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  logger.error(`${req.method} ${req.url} | ${err.message}`);
  res.status(status).json({ message: err.message || "Internal Server Error" });
};
