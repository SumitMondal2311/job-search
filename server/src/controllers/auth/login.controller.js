import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { setTimeout } from "timers/promises";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  NODE_ENV,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../../config/env.js";
import prisma from "../../config/prisma.js";
import redis from "../../config/redis.js";
import { generateToken, loginSchema } from "../../services/auth.service.js";

const login = async (req, res, next) => {
  const userAgent = req.headers["user-agent"];
  if (!userAgent) {
    return res.status(400).json({ message: "Missing UA header" });
  }

  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  const { email, password } = result.data;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    await setTimeout(1000);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatched = await bcrypt.compare(password, user.password);
  if (!isMatched) {
    await setTimeout(1000);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const accessToken = generateToken({
    uid: user.id,
    secret: ACCESS_TOKEN_SECRET,
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const [cursor, keys] = await redis.scan(0, { match: "session:*" });
  if (keys.length > 0) {
    const sessions = await redis.mget(keys);
    for (const session of sessions) {
      if (!sessions) continue;

      const sessionData = session;
      if (sessionData.userAgent === userAgent) {
        return res.status(403).json({ message: "You're already logged in" });
      }
    }
  }

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
    sid: sessionId,
    uid: user.id,
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

  res.status(200).json({ accessToken, message: "Logged in successfully" });
};

export default login;
