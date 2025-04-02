import { randomBytes } from "crypto";
import redis from "../config/redis.js";
import transporter from "../config/transporter.js";
import verificationTemplate from "../templates/verification.template.js";

const sendVerificationEmail = async (name, email) => {
  try {
    const cooldownKey = `cooldown:${email}`;
    const isCooldownExists = await redis.exists(cooldownKey);
    if (isCooldownExists) {
      throw new Error("Try after sometime");
    }

    const code = randomBytes(3).toString("hex").toUpperCase();

    const pipeline = redis.multi();
    pipeline.set(`verification:${email}`, code, { ex: 60 * 60 });
    pipeline.set(cooldownKey, "cooldown", { ex: 60 });
    await pipeline.exec();

    await transporter.sendMail({
      from: "JobSearch <notification@jobsearch.com>",
      to: email,
      subject: "Confirm your JobSearch account",
      html: verificationTemplate(name, code),
    });
  } catch (error) {
    throw new Error("Failed to send verification email: " + error);
  }
};

export default sendVerificationEmail;
