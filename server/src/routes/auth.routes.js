import { Router } from "express";
import deleteAccount from "../controllers/auth/deleteAccount.controller.js";
import login from "../controllers/auth/login.controller.js";
import logout from "../controllers/auth/logout.controller.js";
import refreshToken from "../controllers/auth/refreshToken.controller.js";
import signup from "../controllers/auth/signup.controller.js";
import verifyEmail from "../controllers/auth/verifyEmail.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import handleAsync from "../utils/handleAsync.js";

const AuthRouter = Router();

AuthRouter.post("/signup", handleAsync(signup));
AuthRouter.post("/login", handleAsync(login));
AuthRouter.patch("/verify-email", handleAsync(verifyEmail));
AuthRouter.get("/refresh-token", handleAsync(refreshToken));

AuthRouter.use(authMiddleware);

AuthRouter.post("/logout", handleAsync(logout));
AuthRouter.delete("/delete-account", handleAsync(deleteAccount));

export default AuthRouter;
