import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { UserRole } from "../entities/user.entity";

// 🧾 Register Organizer
export const registerOrganizer = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const user = await authService.registerUser(email, username, password, UserRole.ORGANIZER);
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
};

// 🧾 Register Contestant
export const registerContestant = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const user = await authService.registerUser(email, username, password, UserRole.CONTESTANT);
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
};
export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const { token, user } = await authService.loginUser(identifier, password);

  // 🍪 Set HttpOnly cookie (for browser-based frontend)
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only https in prod
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  // 📦 Return token (for Swagger / Postman)
  res.status(200).json({
    message: "Login successful",
    token: `Bearer ${token}`, // 👈 Added here for Swagger testing
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
};


export const logout = async (req: Request, res: Response) => {
  // 🍪 Clear cookie on logout
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// 🧍‍♂️ Current user (protected route)
export const me = async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
};

