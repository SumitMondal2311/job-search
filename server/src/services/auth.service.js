import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import z from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .transform((str) => str.toLowerCase()),
  password: z
    .string()
    .trim()
    .min(8, "Password must contains atleast 8 characters")
    .max(20, "Password must contain atmost 20 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least 1 special character"
    ),
  role: z.enum(["CANDIDATE", "RECRUITER"]),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .transform((str) => str.toLowerCase()),
  password: z
    .string()
    .trim()
    .min(8, "Password must contains atleast 8 characters")
    .max(20, "Password must contain atmost 20 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least 1 special character"
    ),
});

export const verifyEmailSchema = z.object({
  code: z.string().trim().min(6, "Invalid code").max(6, "Invalid code"),
});

export const generateHash = async (value) => await bcrypt.hash(value, 10);

export const generateToken = ({ sid, uid, secret, expiresIn }) => {
  return jwt.sign({ sid, uid }, secret, { expiresIn });
};

export const checkTokenError = (error) => {
  const jwtError = error instanceof jwt.JsonWebTokenError;
  const expiryError = error instanceof jwt.TokenExpiredError;
  const malformError = error instanceof SyntaxError;

  return expiryError || jwtError || malformError;
};

export const compareHash = async (value, hashedValue) => {
  return await bcrypt.compare(value, hashedValue);
};

export const verifyToken = (token, secret) => jwt.verify(token, secret);
