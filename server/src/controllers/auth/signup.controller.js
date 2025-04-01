import bcrypt from "bcryptjs";
import { setTimeout } from "timers/promises";
import prisma from "../../config/prisma.js";
import { signupSchema } from "../../services/auth.service.js";
import sendVerificationEmail from "../../services/email.service.js";

const signup = async (req, res, next) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  const { fullName, email, password, role } = result.data;
  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    await setTimeout(1000);
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { fullName, email, password: hashedPassword, role },
  });

  await sendVerificationEmail(fullName, email);

  res
    .status(201)
    .json({ message: "Signed up successfully, please verify your email" });
};

export default signup;
