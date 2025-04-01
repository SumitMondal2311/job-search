import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../../config/env.js";
import prisma from "../../config/prisma.js";
import redis from "../../config/redis.js";
import {
  checkTokenError,
  generateToken,
  verifyToken,
} from "../../services/auth.service.js";

const refreshToken = async (req, res) => {
  const refreshToken = req.cookies["__refresh_token__"];
  if (!refreshToken) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  let decoded;

  try {
    decoded = verifyToken(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (error) {
    if (checkTokenError(error)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.uid },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const existingSessionKey = `session:${decoded.sid}`;
  const sessionData = await redis.get(existingSessionKey);
  if (!sessionData) {
    return res.status(404).json({ message: "Session not found" });
  }

  const { token } = sessionData;

  try {
    verifyToken(token, ACCESS_TOKEN_SECRET);
    return res.status(200).json({ message: "Access token is still valid" });
  } catch (error) {
    if (!(error instanceof jwt.TokenExpiredError)) {
      return res.status(401).json({ message: "Invalid access token" });
    }
  }

  const accessToken = generateToken({
    uid: user.id,
    secret: ACCESS_TOKEN_SECRET,
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const pipeline = redis.multi();
  pipeline.set(`blacklist:${token}`, "revoked", {
    ex: ACCESS_TOKEN_EXPIRY,
  });

  pipeline.set(
    existingSessionKey,
    { ...sessionData, token: accessToken },
    { ex: REFRESH_TOKEN_EXPIRY }
  );
  pipeline.exec();

  res.status(200).json({ accessToken, message: "Access token refreshed" });
};

export default refreshToken;
