import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            required: true,
        },
        patientName: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        hospital: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        isEmergency: {
            type: Boolean,
            default: false,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
