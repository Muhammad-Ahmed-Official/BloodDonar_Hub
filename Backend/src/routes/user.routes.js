import { Router } from "express";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware.js";
import { donationRequest, medicalInfo, profileSetUp } from "../controllers/user.controller.js";

const userRouter = Router();
userRouter.route("/createProfile").post(verifyJwt, profileSetUp);
userRouter.route("/medicalInfo").post(verifyJwt, medicalInfo);
userRouter.route("/donarRequest").post(verifyJwt, donationRequest);

export default userRouter;