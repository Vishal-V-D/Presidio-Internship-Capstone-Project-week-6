import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "1h";

export const signJwt = (payload: object) => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  const token = jwt.sign(payload, JWT_SECRET, options);
  console.log("🔐 [JWT] Token signed successfully");
  return token;
};

export const verifyJwt = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err: any) {
    console.error("❌ [JWT] Verification failed!");
    console.error("   • Message:", err.message);
    console.error("   • Name:", err.name);
    console.error("   • Token snippet:", token?.slice(0, 30) + "...");
    console.error("   • JWT_SECRET (first 4 chars):", String(JWT_SECRET).slice(0, 4), "...");
    throw { status: 403, message: `JWT verification failed: ${err.message}` };
  }
};
