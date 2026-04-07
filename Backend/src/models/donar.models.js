import mongoose, { Schema } from "mongoose";

const yesNoEnum = ["yes", "no"];

const donarSchema = new mongoose.Schema({
    medicalInformation: {
        diabetes: { 
            type: String, 
            enum: yesNoEnum, 
            required: true 
        },
        headOrLungsProblem: { 
            type: String, 
            enum: yesNoEnum, 
            required: true 
        },
        recentCovid: { 
            type: String, 
            enum: yesNoEnum, 
            required: true 
        },
        cancerHistory: { 
            type: String, 
            enum: yesNoEnum,
            required: true 
        },
        hivAidsTest: { 
            type: String, 
            enum: yesNoEnum, 
            required: true 
        },
        recentVaccination: { 
            type: String, 
            enum: yesNoEnum, 
            required: true 
        },
    },

    requests: {
        donarName: { 
            type: String, 
        }, 
        bloodGroup: { 
            type: String, 
        },
        amount: { 
            type: String, 
        }, 
        age: { 
            type: Number, 
        },
        date: { 
            type: Date, 
        },
        hospitalName: { 
            type: String, 
        },
        location: { 
            type: String, 
        },
        contactPersonName: { 
            type: String, 
        },
        mobileNumber: { 
            type: String, 
        },
        city: { 
            type: String, 
        },
        startTime: { 
            type: String, 
        },
        endTime: { 
            type: String, 
        },
        reason: { 
            type: String, 
        }, 
        donateTo: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            // required: true 
        }, 
    },
}, { timestamps: true })

export const Donar = mongoose.model("Donar", donarSchema);