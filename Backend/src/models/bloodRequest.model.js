import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
    {
        patientName: {
            type: String,
            required: true,
            trim: true,
        },
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            required: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        urgencyLevel: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            required: true,
            lowercase: true,
            trim: true,
        },
        requiredUnits: {
            type: Number,
            required: true,
            min: 1,
        },
        contactInfo: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const BloodRequest = mongoose.model("BloodRequest", bloodRequestSchema);
