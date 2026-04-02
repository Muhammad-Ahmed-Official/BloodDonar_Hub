import { Router } from 'express'
import { changeCurrentPassword, forgotPassword, login, signup } from '../controllers/auth.controller.js';

const authRouter = Router();
authRouter.route("/signup").post(signup);
authRouter.route("/login").post(login);
authRouter.route("/forgot-password").post(forgotPassword);
authRouter.route("/change-password").post(changeCurrentPassword)

export default authRouter;