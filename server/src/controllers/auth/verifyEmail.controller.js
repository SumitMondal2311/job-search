import { randomBytes } from "crypto";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  NODE_ENV,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../../config/env.js";
import prisma from "../../config/prisma.js";
import redis from "../../config/redis.js";
import {
  generateToken,
  verifyEmailSchema,
} from "../../services/auth.service.js";

const verifyEmail = async (req, res, next) => {
  const email = decodeURIComponent(req.query.email);
  if (!email) {
    return res.status(401).json({ message: "Malformed URL" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isVerified: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(403).json({ message: "Account already verified" });
  }

  const userAgent = req.headers["user-agent"];
  if (!userAgent) {
    return res.status(400).json({ message: "Missing UA header" });
  }

  const result = verifyEmailSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  const { code } = result.data;
  const verificationKey = `verification:${email}`;
  const storedCode = await redis.get(verificationKey);
  if (code != storedCode) {
    return res.status(401).json({ message: "Incorrect code" });
  }

  const accessToken = generateToken({
    uid: user.id,
    secret: ACCESS_TOKEN_SECRET,
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const sessionId = randomBytes(32).toString("hex");
  const sessionData = {
    userId: user.id,
    userAgent,
    token: accessToken,
  };

  await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), {
    ex: REFRESH_TOKEN_EXPIRY,
  });

  const refreshToken = generateToken({
    uid: user.id,
    sid: sessionId,
    secret: REFRESH_TOKEN_SECRET,
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  res.cookie("__refresh_token__", refreshToken, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    maxAge: REFRESH_TOKEN_EXPIRY * 1000,
    path: "/",
    sameSite: "lax",
  });

  await Promise.all([
    prisma.user.update({
      where: { email },
      data: { isVerified: true },
    }),
    redis.del(verificationKey),
  ]);

  res
    .status(200)
    .json({ accessToken, message: "Account verified successfully" });
};

export default verifyEmail;
