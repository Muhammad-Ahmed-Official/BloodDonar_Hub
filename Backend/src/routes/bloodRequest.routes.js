import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    createBloodRequest,
    respondToRequest,
    confirmDonation,
    getMyRequests,
    getMyAssignments,
} from "../controllers/bloodRequest.controller.js";

const bloodRequestRouter = Router();

bloodRequestRouter.use(verifyJwt);

bloodRequestRouter.route("/").post(createBloodRequest);
bloodRequestRouter.route("/my-requests").get(getMyRequests);
bloodRequestRouter.route("/my-assignments").get(getMyAssignments);
bloodRequestRouter.route("/:id/respond").patch(respondToRequest);
bloodRequestRouter.route("/:id/confirm").patch(confirmDonation);

export default bloodRequestRouter;
