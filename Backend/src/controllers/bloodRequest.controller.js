import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { BloodRequest } from "../models/bloodRequest.model.js";
import { UserInfo } from "../models/userInfo.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { responseMessages } from "../constants/responseMessages.js";
import {
    notifyDonorBloodRequest,
    notifyDonorConfirmation,
} from "../services/notification.service.js";

const {
    GET_SUCCESS_MESSAGES,
    ADD_SUCCESS_MESSAGES,
    UPDATE_SUCCESS_MESSAGES,
    MISSING_FIELDS,
    NO_DATA_FOUND,
    UNAUTHORIZED_REQUEST,
} = responseMessages;

// Donor blood groups compatible with each patient blood group
const COMPATIBLE_DONORS = {
    "A+":  ["A+", "A-", "O+", "O-"],
    "A-":  ["A-", "O-"],
    "B+":  ["B+", "B-", "O+", "O-"],
    "B-":  ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+":  ["O+", "O-"],
    "O-":  ["O-"],
};

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── CREATE BLOOD REQUEST ─────────────────────────────────────────────────────
// POST /api/v1/bloodRequest
export const createBloodRequest = asyncHandler(async (req, res) => {
    const receiverId = req.user._id;

    const {
        patientName, bloodGroup, requiredUnits, location, city,
        hospitalName, contactInfo, urgencyLevel, donationDate, donationWindow,
    } = req.body;

    const requiredFields = ["patientName", "bloodGroup", "requiredUnits", "location", "city", "hospitalName", "contactInfo", "urgencyLevel", "donationDate", "donationWindow"];
    const missing = requiredFields.filter((f) => req.body[f] === undefined || req.body[f] === "");
    if (missing.length) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Missing fields: ${missing.join(", ")}`);
    }

    if (!donationWindow?.startTime || !donationWindow?.endTime) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "donationWindow.startTime and endTime are required");
    }

    const units = Number(requiredUnits);
    if (!units || units < 1) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "requiredUnits must be at least 1");
    }

    const compatibleGroups = COMPATIBLE_DONORS[bloodGroup];
    if (!compatibleGroups) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid blood group");
    }

    // Find eligible donors: blood-compatible, willing, not suspended, not the receiver
    const eligibleUserInfos = await UserInfo.find({
        bloodGroup: { $in: compatibleGroups },
        canDonateBlood: "yes",
    }).populate({
        path: "user",
        match: { suspended: false, _id: { $ne: receiverId } },
        select: "_id expoPushToken",
    });

    const eligible = eligibleUserInfos.filter((ui) => ui.user != null);

    if (eligible.length === 0) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            `No eligible donors found for blood group ${bloodGroup}`
        );
    }

    // Randomly select up to requiredUnits donors (max 1 unit per donor)
    const selected = shuffleArray(eligible).slice(0, units);

    const donorsArr = selected.map((ui) => ({
        donor: ui.user._id,
        status: "pending",
        notificationSent: false,
    }));

    const bloodRequest = await BloodRequest.create({
        patientName,
        bloodGroup,
        requiredUnits: units,
        location,
        city,
        hospitalName,
        contactInfo,
        urgencyLevel: String(urgencyLevel).toLowerCase(),
        donationDate: new Date(donationDate),
        donationWindow: {
            startTime: donationWindow.startTime,
            endTime: donationWindow.endTime,
        },
        createdBy: receiverId,
        donors: donorsArr,
    });

    // Send push notifications to each selected donor — fire and settle
    const notifyResults = await Promise.allSettled(
        selected.map(async (ui, idx) => {
            const token = ui.user.expoPushToken;
            if (token) {
                await notifyDonorBloodRequest(token, bloodRequest._id, receiverId);
                await BloodRequest.updateOne(
                    { _id: bloodRequest._id, "donors._id": bloodRequest.donors[idx]._id },
                    { $set: { "donors.$.notificationSent": true } }
                );
            }
        })
    );

    notifyResults.forEach((r, i) => {
        if (r.status === "rejected") {
            console.error(`[Push] Failed for donor index ${i}:`, r.reason?.message);
        }
    });

    // Real-time: tell receiver their request was created
    const io = req.app.get("io");
    io.to(String(receiverId)).emit("requestUpdated", {
        requestId: String(bloodRequest._id),
        status: "in_progress",
        event: "request_created",
    });

    return res.status(StatusCodes.CREATED).send(
        new ApiResponse(StatusCodes.CREATED, ADD_SUCCESS_MESSAGES, bloodRequest)
    );
});


// ─── DONOR RESPONDS (ACCEPT / REJECT) ────────────────────────────────────────
// PATCH /api/v1/bloodRequest/:id/respond
export const respondToRequest = asyncHandler(async (req, res) => {
    const donorId = req.user._id;
    const { id } = req.params;
    const { action } = req.body;

    if (!["accept", "reject"].includes(action)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "action must be 'accept' or 'reject'");
    }

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request id");
    }

    const bloodRequest = await BloodRequest.findById(id);
    if (!bloodRequest) throw new ApiError(StatusCodes.NOT_FOUND, NO_DATA_FOUND);

    if (bloodRequest.status !== "in_progress") {
        throw new ApiError(StatusCodes.CONFLICT, "This request is no longer active");
    }

    const donorEntry = bloodRequest.donors.find(
        (d) => String(d.donor) === String(donorId)
    );
    if (!donorEntry) throw new ApiError(StatusCodes.FORBIDDEN, UNAUTHORIZED_REQUEST);

    if (donorEntry.status !== "pending") {
        throw new ApiError(StatusCodes.CONFLICT, "You have already responded to this request");
    }

    const io = req.app.get("io");
    const receiverId = String(bloodRequest.createdBy);

    if (action === "accept") {
        donorEntry.status = "accepted";
        donorEntry.respondedAt = new Date();
        await bloodRequest.save();

        io.to(receiverId).emit("requestUpdated", {
            requestId: String(bloodRequest._id),
            donorId: String(donorId),
            donorStatus: "accepted",
            event: "donor_accepted",
        });
        io.to(String(donorId)).emit("requestUpdated", {
            requestId: String(bloodRequest._id),
            donorStatus: "accepted",
            event: "donor_accepted",
        });

    } else {
        donorEntry.status = "rejected";
        donorEntry.respondedAt = new Date();
        await bloodRequest.save();

        io.to(receiverId).emit("requestUpdated", {
            requestId: String(bloodRequest._id),
            donorId: String(donorId),
            donorStatus: "rejected",
            event: "donor_rejected",
        });

        // Find replacement donor without awaiting — non-blocking
        findAndAssignReplacementDonor(bloodRequest, donorId, io).catch((err) => {
            console.error("[Replacement] Error:", err.message);
        });
    }

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, UPDATE_SUCCESS_MESSAGES, { action })
    );
});


// ─── DONOR CONFIRMS DONATION (YES / NO) ──────────────────────────────────────
// PATCH /api/v1/bloodRequest/:id/confirm
export const confirmDonation = asyncHandler(async (req, res) => {
    const donorId = req.user._id;
    const { id } = req.params;
    const { confirmed } = req.body;

    const isConfirmed = confirmed === true || confirmed === "true";

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request id");
    }

    const bloodRequest = await BloodRequest.findById(id);
    if (!bloodRequest) throw new ApiError(StatusCodes.NOT_FOUND, NO_DATA_FOUND);

    const donorEntry = bloodRequest.donors.find(
        (d) => String(d.donor) === String(donorId)
    );
    if (!donorEntry) throw new ApiError(StatusCodes.FORBIDDEN, UNAUTHORIZED_REQUEST);

    if (donorEntry.status !== "accepted") {
        throw new ApiError(StatusCodes.CONFLICT, "You can only confirm after accepting the request");
    }

    donorEntry.status = isConfirmed ? "completed" : "cancelled";
    donorEntry.confirmedAt = new Date();

    // Update overall request status when all donors have finalized
    const allFinalized = bloodRequest.donors.every((d) =>
        ["completed", "cancelled", "rejected"].includes(d.status)
    );
    if (allFinalized) {
        const anyCompleted = bloodRequest.donors.some((d) => d.status === "completed");
        bloodRequest.status = anyCompleted ? "completed" : "cancelled";
    }

    await bloodRequest.save();

    const io = req.app.get("io");
    const receiverId = String(bloodRequest.createdBy);
    const eventName = isConfirmed ? "donation_confirmed" : "donation_cancelled";

    const payload = {
        requestId: String(bloodRequest._id),
        donorId: String(donorId),
        donorStatus: donorEntry.status,
        overallStatus: bloodRequest.status,
        event: eventName,
    };

    io.to(receiverId).emit("requestUpdated", payload);
    io.to(String(donorId)).emit("requestUpdated", payload);

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, UPDATE_SUCCESS_MESSAGES, {
            confirmed: isConfirmed,
            requestStatus: bloodRequest.status,
        })
    );
});


// ─── GET RECEIVER'S OWN BLOOD REQUESTS (Receiver tab) ────────────────────────
// GET /api/v1/bloodRequest/my-requests
export const getMyRequests = asyncHandler(async (req, res) => {
    const receiverId = req.user._id;

    const requests = await BloodRequest.find({ createdBy: receiverId })
        .populate({ path: "donors.donor", select: "userName" })
        .sort({ createdAt: -1 });

    // One card per donor assignment so the receiver sees each donor separately
    const result = requests.flatMap((r) => {
        if (r.donors.length === 0) {
            return [{
                _id: String(r._id),
                requestId: String(r._id),
                donarName: "Searching for donors…",
                city: r.city,
                bloodGroup: r.bloodGroup,
                hospitalName: r.hospitalName,
                units: 1,
                status: "pending",
            }];
        }
        return r.donors.map((d) => ({
            _id: String(d._id),
            requestId: String(r._id),
            donarName: d.donor?.userName ?? "Unknown",
            city: r.city,
            bloodGroup: r.bloodGroup,
            hospitalName: r.hospitalName,
            units: 1,
            status: mapReceiverStatus(d.status, r.status),
        }));
    });

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, result)
    );
});


// ─── GET DONOR'S ASSIGNMENTS (Donor tab) ─────────────────────────────────────
// GET /api/v1/bloodRequest/my-assignments
export const getMyAssignments = asyncHandler(async (req, res) => {
    const donorId = req.user._id;

    const requests = await BloodRequest.find({ "donors.donor": donorId })
        .populate({ path: "createdBy", select: "userName" })
        .sort({ createdAt: -1 });

    const result = requests.map((r) => {
        const donorEntry = r.donors.find((d) => String(d.donor) === String(donorId));
        return {
            _id: String(donorEntry._id),
            requestId: String(r._id),
            receiverName: r.patientName,
            city: r.city,
            bloodGroup: r.bloodGroup,
            hospitalName: r.hospitalName,
            units: 1,
            status: mapDonorStatus(donorEntry.status),
            donorStatus: donorEntry.status,
        };
    });

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, result)
    );
});


// ─── HELPERS ─────────────────────────────────────────────────────────────────

function mapReceiverStatus(donorStatus, requestStatus) {
    if (requestStatus === "cancelled") return "cancelled";
    if (donorStatus === "completed") return "completed";
    if (donorStatus === "cancelled" || donorStatus === "rejected") return "cancelled";
    return "pending"; // pending or accepted
}

function mapDonorStatus(donorStatus) {
    if (donorStatus === "completed") return "completed";
    return "in_progress";
}

async function findAndAssignReplacementDonor(bloodRequest, rejectedDonorId, io) {
    const compatibleGroups = COMPATIBLE_DONORS[bloodRequest.bloodGroup];
    if (!compatibleGroups) return;

    // Exclude all donors already in this request
    const alreadyAssignedIds = bloodRequest.donors.map((d) =>
        new mongoose.Types.ObjectId(String(d.donor))
    );

    const eligibleUserInfos = await UserInfo.find({
        bloodGroup: { $in: compatibleGroups },
        canDonateBlood: "yes",
    }).populate({
        path: "user",
        match: {
            suspended: false,
            _id: { $nin: alreadyAssignedIds },
        },
        select: "_id expoPushToken",
    });

    const eligible = eligibleUserInfos.filter((ui) => ui.user != null);
    if (eligible.length === 0) {
        console.log("[Replacement] No eligible replacement donors available");
        return;
    }

    const [replacement] = shuffleArray(eligible);
    const replacementUserId = replacement.user._id;

    // Atomic push: re-fetch and update to avoid race conditions
    const updated = await BloodRequest.findOneAndUpdate(
        { _id: bloodRequest._id, status: "in_progress" },
        {
            $push: {
                donors: {
                    donor: replacementUserId,
                    status: "pending",
                    notificationSent: false,
                },
            },
        },
        { new: true }
    );

    if (!updated) return; // request was cancelled in the meantime

    if (replacement.user.expoPushToken) {
        await notifyDonorBloodRequest(
            replacement.user.expoPushToken,
            bloodRequest._id,
            bloodRequest.createdBy
        );
        const lastEntry = updated.donors[updated.donors.length - 1];
        await BloodRequest.updateOne(
            { _id: bloodRequest._id, "donors._id": lastEntry._id },
            { $set: { "donors.$.notificationSent": true } }
        );
    }

    io.to(String(bloodRequest.createdBy)).emit("requestUpdated", {
        requestId: String(bloodRequest._id),
        event: "replacement_assigned",
        newDonorId: String(replacementUserId),
    });
}
