import { REFRESH_TOKEN_SECRET } from "../../config/env.js";
import redis from "../../config/redis.js";
import { checkTokenError, verifyToken } from "../../services/auth.service.js";

const logout = async (req, res, next) => {
  const decoded = req.decoded;
  const existingSessionId = decoded.sid;
  const existingSessionKey = `session:${existingSessionId}`;
  const session = await redis.get(existingSessionKey);
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  const accessToken = session.token;

  const pipeline = redis.multi();
  pipeline.set(`blacklist:${accessToken}`, "revoked", { ex: 60 * 15 });
  pipeline.del(existingSessionKey);
  pipeline.exec();

  res.cookie("__refresh_token__", "", { expires: new Date(0) });

  res.status(200).json({ message: "Logged out successfully" });
};

export default logout;
