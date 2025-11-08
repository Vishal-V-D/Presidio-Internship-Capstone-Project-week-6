import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.util";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookieToken = req.cookies?.token;
    

    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = cookieToken || headerToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = verifyJwt(token);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden: invalid or expired token" });
  }
};
