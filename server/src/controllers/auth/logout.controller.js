import redis from "../../config/redis.js";

const logout = async (req, res, next) => {
  const refreshToken = req.cookies["__refresh_token__"];

  const existingSessionId = req.decoded.sid;
  const existingSessionKey = `session:${existingSessionId}`;
  const sessionData = await redis.get(existingSessionKey);
  const accessToken = sessionData.token;

  const sessionTtl = await redis.ttl(existingSessionKey);

  const pipeline = redis.multi();
  pipeline.set(`blacklist:${accessToken}`, "revoked", { ex: 60 * 15 });
  pipeline.set(`blacklist:${refreshToken}`, "revoked", { ex: sessionTtl });
  pipeline.del(existingSessionKey);
  await pipeline.exec();

  res.cookie("__refresh_token__", "", { expires: new Date(0) });

  res.status(200).json({ message: "Logged out successfully" });
};

export default logout;
