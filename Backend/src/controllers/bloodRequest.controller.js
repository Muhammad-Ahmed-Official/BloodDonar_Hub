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
    sendPushNotification,
} from "../services/notification.service.js";
import { User } from "../models/user.model.js";

const {
    GET_SUCCESS_MESSAGES,
    ADD_SUCCESS_MESSAGES,
    UPDATE_SUCCESS_MESSAGES,
    DELETED_SUCCESS_MESSAGES,
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

// Build a concrete UTC Date from donationDate + "HH:mm" endTime string.
// Used to set expiresAt so cron jobs can query by a real Date field.
function buildExpiresAt(donationDateObj, endTimeStr) {
    const parts = String(endTimeStr).split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    const d = new Date(donationDateObj);
    d.setHours(h, m, 0, 0);
    return d;
}

// ─── CREATE BLOOD REQUEST ─────────────────────────────────────────────────────
// POST /api/v1/bloodRequest
export const createBloodRequest = asyncHandler(async (req, res) => {
    const receiverId = req.user._id;

    const {
        patientName, bloodGroup, requiredUnits, location, city,
        hospitalName, contactInfo, urgencyLevel, donationDate, donationWindow,
        age, reason,
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

    // Randomly select up to requiredUnits donors (max 1 unit per donor)
    // If no eligible donors exist right now the request is still saved with an
    // empty donors array; getMyRequests shows it as "Searching for donors…".
    const selected = shuffleArray(eligible).slice(0, units);

    const donorsArr = selected.map((ui) => ({
        donor: ui.user._id,
        status: "pending",
        notificationSent: false,
    }));

    const donationDateObj = new Date(donationDate);
    const expiresAt = buildExpiresAt(donationDateObj, donationWindow.endTime);

    const bloodRequest = await BloodRequest.create({
        patientName,
        bloodGroup,
        requiredUnits: units,
        location,
        city,
        hospitalName,
        contactInfo,
        urgencyLevel: String(urgencyLevel).toLowerCase(),
        donationDate: donationDateObj,
        donationWindow: {
            startTime: donationWindow.startTime,
            endTime: donationWindow.endTime,
        },
        ...(age !== undefined && !isNaN(Number(age)) && { age: Number(age) }),
        ...(reason && { reason: String(reason).trim() }),
        ...(expiresAt && { expiresAt }),
        createdBy: receiverId,
        donors: donorsArr,
    });

    // Send push notifications to each selected donor — fire and settle
    const notifyResults = await Promise.allSettled(
        selected.map(async (ui, idx) => {
            const token = ui.user.expoPushToken;
            if (token) {
                await notifyDonorBloodRequest(token, bloodRequest._id, receiverId, {
                    city: String(city),
                    bloodType: String(bloodGroup),
                });
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

    const newStatus = action === "accept" ? "accepted" : "rejected";

    // Atomic positional update — only succeeds when donor status is still "pending".
    // Prevents race conditions from double-taps or simultaneous requests.
    const bloodRequest = await BloodRequest.findOneAndUpdate(
        {
            _id: id,
            status: "in_progress",
            donors: { $elemMatch: { donor: donorId, status: "pending" } },
        },
        {
            $set: {
                "donors.$.status": newStatus,
                "donors.$.respondedAt": new Date(),
            },
        },
        { returnDocument: "after" }
    );

    if (!bloodRequest) {
        // Diagnose failure to return a helpful error
        const existing = await BloodRequest.findById(id);
        if (!existing) throw new ApiError(StatusCodes.NOT_FOUND, NO_DATA_FOUND);
        if (existing.status !== "in_progress") {
            throw new ApiError(StatusCodes.CONFLICT, "This request is no longer active");
        }
        const donorEntry = existing.donors.find((d) => String(d.donor) === String(donorId));
        if (!donorEntry) throw new ApiError(StatusCodes.FORBIDDEN, UNAUTHORIZED_REQUEST);
        throw new ApiError(StatusCodes.CONFLICT, "You have already responded to this request");
    }

    const io = req.app.get("io");
    const receiverId = String(bloodRequest.createdBy);

    if (action === "accept") {
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
        io.to(receiverId).emit("requestUpdated", {
            requestId: String(bloodRequest._id),
            donorId: String(donorId),
            donorStatus: "rejected",
            event: "donor_rejected",
        });
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

    if (bloodRequest.status !== "in_progress") {
        throw new ApiError(StatusCodes.CONFLICT, "This request is no longer active");
    }

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


// ─── CHECK IF USER HAS AN ACTIVE REQUEST ─────────────────────────────────────
// GET /api/v1/bloodRequest/check-active
export const checkActiveRequest = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();

    const active = await BloodRequest.findOne({
        createdBy: userId,
        status: { $ne: "completed" },
        expiresAt: { $gt: now },
    }).select("_id patientName expiresAt status");

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, {
            hasActive: !!active,
            expiresAt: active?.expiresAt ?? null,
            patientName: active?.patientName ?? null,
        })
    );
});


// ─── RECEIVER ACCEPTS OR REJECTS A RESPONDING DONOR ──────────────────────────
// PATCH /api/v1/bloodRequest/:id/receiver-respond
export const receiverRespondToDonor = asyncHandler(async (req, res) => {
    const receiverId = req.user._id;
    const { id } = req.params;
    const { donorId, action } = req.body;

    if (!["accept", "reject"].includes(action)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "action must be 'accept' or 'reject'");
    }
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(donorId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid id");
    }

    const bloodRequest = await BloodRequest.findOne({ _id: id, createdBy: receiverId });
    if (!bloodRequest) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Request not found or not authorized");
    }

    const donorEntry = bloodRequest.donors.find(
        (d) => String(d.donor) === String(donorId)
    );
    if (!donorEntry) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Donor not found in this request");
    }

    const io = req.app.get("io");

    if (action === "accept") {
        const donorUser = await User.findById(donorId).select("expoPushToken");
        if (donorUser?.expoPushToken) {
            await sendPushNotification(
                donorUser.expoPushToken,
                "Your offer was accepted! 🎉",
                "Please be ready to donate blood at the scheduled time.",
                { type: "DONOR_ACCEPTED", requestId: String(id) }
            );
        }
        io.to(String(donorId)).emit("requestUpdated", {
            requestId: String(id),
            event: "receiver_accepted_you",
        });
    } else {
        await BloodRequest.findOneAndUpdate(
            { _id: id, "donors.donor": donorId },
            { $set: { "donors.$.status": "rejected", "donors.$.respondedAt": new Date() } }
        );
        const refreshed = await BloodRequest.findById(id);
        if (refreshed) await findAndAssignReplacementDonor(refreshed, donorId, io);
        io.to(String(donorId)).emit("requestUpdated", {
            requestId: String(id),
            event: "receiver_rejected_you",
        });
    }

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, UPDATE_SUCCESS_MESSAGES, { action })
    );
});


// ─── GET RECEIVER'S OWN BLOOD REQUESTS (Receiver tab) ────────────────────────
// GET /api/v1/bloodRequest/my-requests
export const getMyRequests = asyncHandler(async (req, res) => {
    const receiverId = req.user._id;

    const requests = await BloodRequest.find({ createdBy: receiverId })
        .populate({ path: "donors.donor", select: "userName" })
        .sort({ createdAt: -1 });

    // Batch-load UserInfo for donor bloodGroup + pic
    const allDonorIds = [];
    requests.forEach((r) => {
        r.donors.forEach((d) => {
            if (d.donor?._id) allDonorIds.push(d.donor._id);
        });
    });

    const userInfoMap = {};
    if (allDonorIds.length > 0) {
        const infos = await UserInfo.find({ user: { $in: allDonorIds } }).select("user bloodGroup pic");
        infos.forEach((info) => {
            userInfoMap[String(info.user)] = { bloodGroup: info.bloodGroup, pic: info.pic ?? null };
        });
    }

    // One card per donor assignment so the receiver sees each donor separately
    const result = requests.flatMap((r) => {
        const base = {
            requestId: String(r._id),
            patientName: r.patientName,
            city: r.city,
            bloodGroup: r.bloodGroup,
            hospitalName: r.hospitalName,
            location: r.location,
            donationDate: r.donationDate,
            urgencyLevel: r.urgencyLevel,
            reason: r.reason ?? "",
            units: 1,
        };
        if (r.donors.length === 0) {
            return [{
                _id: String(r._id),
                ...base,
                donorId: null,
                donarName: "Searching for donors…",
                donorBloodGroup: null,
                donorPic: null,
                status: "pending",
                donorStatus: "pending",
            }];
        }
        return r.donors.map((d) => {
            const did = d.donor?._id ? String(d.donor._id) : null;
            const info = did ? (userInfoMap[did] ?? null) : null;
            return {
                _id: String(d._id),
                ...base,
                donorId: did,
                donarName: d.donor?.userName ?? "Unknown",
                donorBloodGroup: info?.bloodGroup ?? null,
                donorPic: info?.pic ?? null,
                status: mapReceiverStatus(d.status, r.status),
                donorStatus: d.status,
            };
        });
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
            _id: String(r._id),
            requestId: String(r._id),
            patientName: r.patientName,
            receiverName: r.patientName,
            city: r.city,
            bloodGroup: r.bloodGroup,
            hospitalName: r.hospitalName,
            location: r.location,
            donationDate: r.donationDate,
            donationWindow: r.donationWindow,
            urgencyLevel: r.urgencyLevel,
            units: 1,
            status: mapDonorStatus(donorEntry.status),
            donorStatus: donorEntry.status,
        };
    });

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, result)
    );
});


// ─── GET DONOR'S PENDING ASSIGNED REQUESTS (for home-page card) ──────────────
// GET /api/v1/bloodRequest/assigned
export const getAssignedBloodRequests = asyncHandler(async (req, res) => {
    const donorId = req.user._id;

    const requests = await BloodRequest.find({
        status: "in_progress",
        donors: { $elemMatch: { donor: donorId, status: { $in: ["pending", "accepted"] } } },
    }).sort({ createdAt: -1 });

    const result = requests.map((r) => {
        const donorEntry = r.donors.find((d) => String(d.donor) === String(donorId));
        return {
            _id: String(r._id),
            patientName: r.patientName,
            bloodGroup: r.bloodGroup,
            city: r.city,
            hospitalName: r.hospitalName,
            location: r.location,
            donationDate: r.donationDate,
            donationWindow: r.donationWindow,
            urgencyLevel: r.urgencyLevel,
            donorStatus: donorEntry?.status ?? "pending",
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
    if (donorStatus === "cancelled" || donorStatus === "rejected") return "cancelled";
    return "in_progress";
}

// ─── PUBLIC FEED OF ALL IN-PROGRESS BLOOD REQUESTS ───────────────────────────
// GET /api/v1/bloodRequest/feed
export const getBloodRequestFeed = asyncHandler(async (req, res) => {
    const { bloodGroup, city } = req.query;

    const filter = { status: "in_progress" };
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter.city = { $regex: city, $options: "i" };

    const requests = await BloodRequest.find(filter)
        .populate({ path: "createdBy", select: "_id userName" })
        .sort({ createdAt: -1 })
        .limit(100);

    const result = requests.map((r) => ({
        _id: String(r._id),
        donarName: r.patientName,
        bloodGroup: r.bloodGroup,
        city: r.city,
        hospitalName: r.hospitalName,
        location: r.location,
        date: r.donationDate ? r.donationDate.toISOString().split("T")[0] : "",
        reason: r.reason ?? "",
        urgencyLevel: r.urgencyLevel,
        userId: r.createdBy,
        source: "bloodRequest",
        status: r.status,
    }));

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, result)
    );
});


// ─── DELETE BLOOD REQUEST (creator only) ─────────────────────────────────────
// DELETE /api/v1/bloodRequest/:id
export const deleteBloodRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request id");
    }

    const request = await BloodRequest.findOneAndDelete({ _id: id, createdBy: userId });
    if (!request) {
        throw new ApiError(StatusCodes.NOT_FOUND, NO_DATA_FOUND);
    }

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, DELETED_SUCCESS_MESSAGES, null)
    );
});


// ─── GET SINGLE BLOOD REQUEST BY ID ──────────────────────────────────────────
// GET /api/v1/bloodRequest/:id
export const getBloodRequestById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request id");
    }

    const request = await BloodRequest.findById(id)
        .populate({ path: "createdBy", select: "userName email" })
        .populate({ path: "donors.donor", select: "userName" });

    if (!request) {
        throw new ApiError(StatusCodes.NOT_FOUND, NO_DATA_FOUND);
    }

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, request)
    );
});


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
            _id: {
                $nin: [
                    ...alreadyAssignedIds,
                    new mongoose.Types.ObjectId(String(bloodRequest.createdBy)),
                ],
            },
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
        { returnDocument: "after" }
    );

    if (!updated) return; // request was cancelled in the meantime

    if (replacement.user.expoPushToken) {
        await notifyDonorBloodRequest(
            replacement.user.expoPushToken,
            bloodRequest._id,
            bloodRequest.createdBy,
            { city: bloodRequest.city, bloodType: bloodRequest.bloodGroup }
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
