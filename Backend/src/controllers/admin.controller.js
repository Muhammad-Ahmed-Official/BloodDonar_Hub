import { StatusCodes } from "http-status-codes";
import { User } from "../models/user.model.js";
import { UserInfo } from "../models/userInfo.model.js";
import { Donar } from "../models/donar.models.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { responseMessages } from "../constants/responseMessages.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const {
    GET_SUCCESS_MESSAGES,
    ADD_SUCCESS_MESSAGES,
    UPDATE_SUCCESS_MESSAGES,
    DELETED_SUCCESS_MESSAGES,
    NO_USER,
    NO_DATA_FOUND,
    MISSING_FIELDS,
    USER_EXISTS,
} = responseMessages;


// ─── USERS ───────────────────────────────────────────────────────────────────

// @desc    Get all users with their profile info
// @route   GET /api/v1/admin/users
// @access  Admin
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { role: { $ne: "admin" } };
    if (search) {
        filter.$or = [
            { userName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select("-password -otp -expiresIn")
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 }),
        User.countDocuments(filter),
    ]);

    // Attach userInfo to each user
    const userIds = users.map((u) => u._id);
    const infos = await UserInfo.find({ user: { $in: userIds } });
    const infoMap = {};
    infos.forEach((i) => { infoMap[i.user.toString()] = i; });

    const result = users.map((u) => ({
        ...u.toObject(),
        userInfo: infoMap[u._id.toString()] || null,
    }));

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, { users: result, total, page: parseInt(page), limit: parseInt(limit) })
    );
});


// @desc    Create a user (admin only)
// @route   POST /api/v1/admin/users
// @access  Admin
export const createUser = asyncHandler(async (req, res) => {
    const { userName, email, password, role = "user" } = req.body;

    if (!userName || !email || !password) {
        throw new ApiError(StatusCodes.BAD_REQUEST, MISSING_FIELDS);
    }

    const exists = await User.findOne({ $or: [{ userName }, { email }] });
    if (exists) {
        throw new ApiError(StatusCodes.CONFLICT, USER_EXISTS);
    }

    const user = await User.create({
        userName: userName.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        role,
        isVerified: true, // admin-created accounts skip verification
    });

    const created = await User.findById(user._id).select("-password -otp -expiresIn");
    return res.status(StatusCodes.CREATED).send(new ApiResponse(StatusCodes.CREATED, ADD_SUCCESS_MESSAGES, created));
});


// @desc    Suspend or unsuspend a user
// @route   PATCH /api/v1/admin/users/:id/suspend
// @access  Admin
export const toggleSuspendUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, NO_USER);
    }

    if (user.role === "admin") {
        throw new ApiError(StatusCodes.FORBIDDEN, "Cannot suspend another admin");
    }

    user.suspended = !user.suspended;
    await user.save({ validateBeforeSave: false });

    const status = user.suspended ? "suspended" : "activated";
    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, `User ${status} successfully`, { suspended: user.suspended })
    );
});


// @desc    Delete a user
// @route   DELETE /api/v1/admin/users/:id
// @access  Admin
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, NO_USER);
    }

    if (user.role === "admin") {
        throw new ApiError(StatusCodes.FORBIDDEN, "Cannot delete another admin");
    }

    // Clean up related documents
    await Promise.all([
        UserInfo.findOneAndDelete({ user: user._id }),
        Donar.findOneAndDelete({ user: user._id }),
        User.findByIdAndDelete(user._id),
    ]);

    return res.status(StatusCodes.OK).send(new ApiResponse(StatusCodes.OK, DELETED_SUCCESS_MESSAGES, {}));
});


// ─── DONATION REQUESTS ───────────────────────────────────────────────────────

// @desc    Get all donation requests
// @route   GET /api/v1/admin/requests
// @access  Admin
export const getAllDonationRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, bloodGroup, city } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { "requests.donarName": { $exists: true, $ne: "" } };
    if (bloodGroup) filter["requests.bloodGroup"] = bloodGroup;
    if (city) filter["requests.city"] = { $regex: city, $options: "i" };

    const [donars, total] = await Promise.all([
        Donar.find(filter)
            .populate({ path: "user", select: "userName email" })
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ updatedAt: -1 }),
        Donar.countDocuments(filter),
    ]);

    const requests = donars.map((d) => ({
        _id: d._id,
        user: d.user,
        ...d.requests.toObject(),
    }));

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, { requests, total, page: parseInt(page), limit: parseInt(limit) })
    );
});


// ─── POSTS ───────────────────────────────────────────────────────────────────

// @desc    Get all posts
// @route   GET /api/v1/admin/posts
// @access  Admin
export const getAllPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
        Post.find()
            .populate({ path: "author", select: "userName email" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Post.countDocuments(),
    ]);

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, { posts, total, page: parseInt(page), limit: parseInt(limit) })
    );
});


// @desc    Create a post
// @route   POST /api/v1/admin/posts
// @access  Admin
export const createPost = asyncHandler(async (req, res) => {
    const { bloodGroup, patientName, city, hospital, date, address, isEmergency } = req.body;

    if (!bloodGroup || !patientName || !city || !hospital || !date || !address) {
        if (req.file?.path) fs.unlinkSync(req.file.path);
        throw new ApiError(StatusCodes.BAD_REQUEST, MISSING_FIELDS);
    }

    const post = await Post.create({
        bloodGroup,
        patientName,
        city,
        hospital,
        date,
        address,
        isEmergency: isEmergency === "true" || isEmergency === true,
        author: req.user._id,
    });

    const populated = await Post.findById(post._id).populate({ path: "author", select: "userName email" });
    return res.status(StatusCodes.CREATED).send(new ApiResponse(StatusCodes.CREATED, ADD_SUCCESS_MESSAGES, populated));
});


// @desc    Update a post
// @route   PUT /api/v1/admin/posts/:id
// @access  Admin
export const updatePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        throw new ApiError(StatusCodes.NOT_FOUND, NO_DATA_FOUND);
    }

    const allowedFields = ["bloodGroup", "patientName", "city", "hospital", "date", "address", "isEmergency"];
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (updates.isEmergency !== undefined) {
        updates.isEmergency = updates.isEmergency === "true" || updates.isEmergency === true;
    }

    const updated = await Post.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
    ).populate({ path: "author", select: "userName email" });

    return res.status(StatusCodes.OK).send(new ApiResponse(StatusCodes.OK, UPDATE_SUCCESS_MESSAGES, updated));
});


// @desc    Delete a post
// @route   DELETE /api/v1/admin/posts/:id
// @access  Admin
export const deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
        throw new ApiError(StatusCodes.NOT_FOUND, NO_DATA_FOUND);
    }

    return res.status(StatusCodes.OK).send(new ApiResponse(StatusCodes.OK, DELETED_SUCCESS_MESSAGES, {}));
});


// ─── STATS ───────────────────────────────────────────────────────────────────

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Admin
export const getStats = asyncHandler(async (req, res) => {
    const [totalUsers, totalDonors, totalRequests, totalPosts, suspendedUsers] = await Promise.all([
        User.countDocuments({ role: "user" }),
        UserInfo.countDocuments({ canDonateBlood: "yes" }),
        Donar.countDocuments({ "requests.donarName": { $exists: true, $ne: "" } }),
        Post.countDocuments(),
        User.countDocuments({ suspended: true }),
    ]);

    return res.status(StatusCodes.OK).send(
        new ApiResponse(StatusCodes.OK, GET_SUCCESS_MESSAGES, {
            totalUsers,
            totalDonors,
            totalRequests,
            totalPosts,
            suspendedUsers,
        })
    );
});
