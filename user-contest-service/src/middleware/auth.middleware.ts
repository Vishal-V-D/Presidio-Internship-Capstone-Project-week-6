import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.util";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 🎫 Only accept Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[AUTH] Missing or invalid Authorization header");
      return res.status(401).json({ 
        message: "Missing or invalid Authorization header. Format: 'Bearer <token>'",
        details: "Please provide a valid Bearer token in the Authorization header"
      });
    }
    
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      console.error("[AUTH] No token provided");
      return res.status(401).json({ message: "No token provided" });
    }
    
    console.log("[AUTH] Validating token from Authorization header");

    // 🔍 Verify token
    const decoded = verifyJwt(token);
    console.log("[DEBUG] Token decoded:", decoded);

    (req as any).user = decoded;
    next();
  } catch (err) {
    console.error("[DEBUG] Token verification failed:", err);
    return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
  }
};
