import { Router } from "express";
import { verifyJwt, checkAdmin } from "../middlewares/auth.middleware.js";
import {
    getAllUsers,
    createUser,
    toggleSuspendUser,
    deleteUser,
    getAllDonationRequests,
    getAllPosts,
    createPost,
    updatePost,
    deletePost,
    getStats,
} from "../controllers/admin.controller.js";

const adminRouter = Router();

// All admin routes require JWT + admin role
adminRouter.use(verifyJwt, checkAdmin);

// Stats
adminRouter.route("/stats").get(getStats);

// Users
adminRouter.route("/users").get(getAllUsers).post(createUser);
adminRouter.route("/users/:id").delete(deleteUser);
adminRouter.route("/users/:id/suspend").patch(toggleSuspendUser);

// Donation Requests
// adminRouter.route("/requests").get(getAllDonationRequests);

// Posts
adminRouter.route("/posts").get(getAllPosts).post(createPost);
adminRouter.route("/posts/:id").put(updatePost).delete(deletePost);

export default adminRouter;
