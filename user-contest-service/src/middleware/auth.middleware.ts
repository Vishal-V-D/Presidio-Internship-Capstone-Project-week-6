import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.util";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 🍪 Cookie token (browser)
    const cookieToken = req.cookies?.token;

    // 🎫 Authorization header token (microservices / API calls)
    const headerAuth = req.headers.authorization;
    const headerToken = headerAuth?.startsWith("Bearer ") ? headerAuth.split(" ")[1] : null;

    // ✅ Use whichever exists
    const token = cookieToken || headerToken;

    if (!token) {
      console.warn("🚫 No token provided (neither cookie nor header)");
      return res.status(401).json({ message: "Unauthorized: No token found" });
    }

    // 🔍 Verify
    
    const decoded = verifyJwt(token);
   

    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
  }
};
