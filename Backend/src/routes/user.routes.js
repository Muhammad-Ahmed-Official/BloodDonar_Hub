import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    profileSetUp,
    getProfile,
    changeNumber,
    updateProfile,
    medicalInfo,
    getMedicalInfo,
    donationRequest,
    getAllRequests,
    getRequestById,
    getPublicUserProfile,
    getDonors,
    getPosts,
} from "../controllers/user.controller.js";

const userRouter = Router();

// All routes require JWT
userRouter.use(verifyJwt);

// Profile
userRouter.route("/createProfile").post(upload.single("avatar"), profileSetUp);
userRouter.route("/profile").get(getProfile);
userRouter.route("/profile").put(upload.single("avatar"), updateProfile);
userRouter.route("/changeNumber").put(changeNumber);

// Medical Info
userRouter.route("/medicalInfo").post(medicalInfo);
userRouter.route("/medicalInfo").get(getMedicalInfo);

// Donation Requests
userRouter.route("/donarRequest").post(donationRequest);
userRouter.route("/requests").get(getAllRequests);
userRouter.route("/public/:userId").get(getPublicUserProfile);
userRouter.route("/requests/:id").get(getRequestById);

// Donors
userRouter.route("/donors").get(getDonors);

// Posts (user view only)
userRouter.route("/posts").get(getPosts);

export default userRouter;
