import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    createBloodRequest,
    respondToRequest,
    confirmDonation,
    getMyRequests,
    getMyAssignments,
    getAssignedBloodRequests,
    getBloodRequestFeed,
    getBloodRequestById,
    deleteBloodRequest,
} from "../controllers/bloodRequest.controller.js";

const bloodRequestRouter = Router();

bloodRequestRouter.use(verifyJwt);

bloodRequestRouter.route("/").post(createBloodRequest);
bloodRequestRouter.route("/my-requests").get(getMyRequests);
bloodRequestRouter.route("/my-assignments").get(getMyAssignments);
bloodRequestRouter.route("/assigned").get(getAssignedBloodRequests);
bloodRequestRouter.route("/feed").get(getBloodRequestFeed);
bloodRequestRouter.route("/:id").get(getBloodRequestById).delete(deleteBloodRequest);
bloodRequestRouter.route("/:id/respond").patch(respondToRequest);
bloodRequestRouter.route("/:id/confirm").patch(confirmDonation);

export default bloodRequestRouter;
