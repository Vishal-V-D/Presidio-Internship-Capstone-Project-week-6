import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { UserRole } from "../entities/user.entity";

// ✅ REGISTER ORGANIZER
export const registerOrganizer = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const user = await authService.registerUser(
    email,
    username,
    password,
    UserRole.ORGANIZER
  );

  res.status(201).json({
    message: "Organizer registered",
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
};

// ✅ REGISTER CONTESTANT
export const registerContestant = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const user = await authService.registerUser(
    email,
    username,
    password,
    UserRole.CONTESTANT
  );

  res.status(201).json({
    message: "Contestant registered",
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
};

// ✅ LOGIN
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { token, user } = await authService.loginUser(email, password);

  res.status(200).json({
    message: "Login successful",
    token: token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
};


// ✅ LOGOUT
export const logout = async (req: Request, res: Response) => {
  // Token invalidation is handled client-side by removing the token
  res.status(200).json({ message: "Logged out successfully" });
};

// ✅ GET CURRENT USER
export const me = async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({ user });
};
