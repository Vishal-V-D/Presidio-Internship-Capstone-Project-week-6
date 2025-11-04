import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.util";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 🧁 Get token from HttpOnly cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token found" });
    }

    // ✅ Verify JWT
    const decoded = verifyJwt(token);
    (req as any).user = decoded;

    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
  }
};
