import mongoose, { Schema } from "mongoose";

const yesNoEnum = ["yes", "no"];

const donarSchema = new mongoose.Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        medicalInformation: {
            diabetes: { type: String, enum: yesNoEnum },
            headOrLungsProblem: { type: String, enum: yesNoEnum },
            recentCovid: { type: String, enum: yesNoEnum },
            cancerHistory: { type: String, enum: yesNoEnum },
            hivAidsTest: { type: String, enum: yesNoEnum },
            recentVaccination: { type: String, enum: yesNoEnum },
        },
        requests: {
            donarName: { type: String },
            bloodGroup: { type: String },
            amount: { type: String },
            age: { type: Number },
            date: { type: String },
            hospitalName: { type: String },
            location: { type: String },
            contactPersonName: { type: String },
            mobileNumber: { type: String },
            city: { type: String },
            startTime: { type: String },
            endTime: { type: String },
            reason: { type: String },
            donateTo: { type: Schema.Types.ObjectId, ref: "User" },
        },
    },
    { timestamps: true }
);

export const Donar = mongoose.model("Donar", donarSchema);
