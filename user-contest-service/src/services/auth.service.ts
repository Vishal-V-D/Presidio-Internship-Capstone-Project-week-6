import { AppDataSource } from "../config/db";
import { User, UserRole } from "../entities/user.entity";
import { hashPassword, comparePassword } from "../utils/password.util";
import { signJwt } from "../utils/jwt.util";

const repo = () => AppDataSource.getRepository(User);

export const registerUser = async (
  email: string,
  username: string,
  password: string,
  role: UserRole
) => {
  const exists = await repo().findOne({
    where: [{ email }, { username }],
  });

  if (exists) throw { status: 400, message: "Email or username already exists" };

  const hashedPassword = await hashPassword(password);

  const user = repo().create({
    email,
    username,
    password: hashedPassword,
    role,
  });

  const savedUser = await repo().save(user);

  return {
    id: savedUser.id,
    email: savedUser.email,
    username: savedUser.username,
    role: savedUser.role,
    createdAt: savedUser.createdAt,
  };
};

export const loginUser = async (emailOrUsername: string, password: string) => {
  const user = await repo()
    .createQueryBuilder("user")
    .where("user.email = :q OR user.username = :q", { q: emailOrUsername })
    .getOne();

  if (!user) throw { status: 401, message: "Invalid credentials" };

  const passwordMatch = await comparePassword(password, user.password);
  if (!passwordMatch) throw { status: 401, message: "Invalid credentials" };

  // ✅ Generate token but don't return it directly — controller will set it in a cookie
  const token = signJwt({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  return { token, user }; // Return token internally, controller will handle the cookie
};
