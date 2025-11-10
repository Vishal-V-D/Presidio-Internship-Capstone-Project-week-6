import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.util";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header. Format: 'Bearer <token>'",
      details: "Please provide a valid Bearer token in the Authorization header" });
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const decoded = verifyJwt(token);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ 
      message: "Authentication failed",
      error: err.message || "Invalid or expired token"
    });
  }
};
