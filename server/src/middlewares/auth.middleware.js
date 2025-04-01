import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../config/env.js";
import prisma from "../config/prisma.js";
import redis from "../config/redis.js";
import { checkTokenError, verifyToken } from "../services/auth.service.js";

const authMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.cookies["__refresh_token__"];
    if (!refreshToken) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const decodedRefreshToken = verifyToken(refreshToken, REFRESH_TOKEN_SECRET);

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Missing auth header" });
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(400).json({ message: "Invalid auth header" });
    }

    const accessToken = authHeader.split(" ")[1];
    if (accessToken.split(".").length !== 3) {
      return res.status(401).json({ message: "Token malformed" });
    }

    const isBlacklisted = await redis.exists(`blacklist:${accessToken}`);
    if (isBlacklisted === 1) {
      return res.status(403).json({ message: "Access token revoked" });
    }

    const decodedAccessToken = verifyToken(accessToken, ACCESS_TOKEN_SECRET);

    const isUserExists = await prisma.user.findUnique({
      where: { id: decodedAccessToken.uid },
    });

    if (!isUserExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingSessionKey = `session:${decodedRefreshToken.sid}`;
    const sessionData = await redis.get(existingSessionKey);
    if (!sessionData) {
      return res.status(404).json({ message: "Session not found" });
    }

    req.decoded = decodedRefreshToken;

    next();
  } catch (error) {
    if (checkTokenError(error)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    next(error);
  }
};

export default authMiddleware;
