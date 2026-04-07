import { StatusCodes } from "http-status-codes";
import { UserInfo } from "../models/userInfo.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { responseMessages } from "../constants/responseMessages.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Donar } from "../models/donar.models.js";
const { NO_USER, GET_SUCCESS_MESSAGES, UPDATE_SUCCESS_MESSAGES, DELETED_SUCCESS_MESSAGES, ADD_SUCCESS_MESSAGES, UPDATE_UNSUCCESS_MESSAGES, NO_DATA_FOUND, MISSING_FIELDS } = responseMessages

const validateFields = (body, requiredFields) => {
    const missingFields = requiredFields.filter(field => body[field] === undefined || body[field] === null);
    if (missingFields.length > 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Missing required fields: ${missingFields.join(", ")}`);
    }
};



export const profileSetUp  = asyncHandler(async(req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, NO_USER);
    };
    
    const avatarLocalePath = req.files?.avatar[0]?.path; 
    if(!avatarLocalePath) throwApiError; avatar = await uploadOnCloudinary(avaltarLocaleFile)  

    const { mobileNumber, bloodGroup, city, dateOfBirth, gender, canDonateBlood, about } = req.body;
    if (!mobileNumber || !bloodGroup || !city || !dateOfBirth || !gender || canDonateBlood === undefined) {
        throw new ApiError(StatusCodes.BAD_REQUEST, MISSING_FIELDS);
    };

    const existingProfile = await UserInfo.findOne({ user: userId });
    if (existingProfile) {
        throw new ApiError(400, "Profile already exists");
    };

    const profile = await UserInfo.create({ user: userId, mobileNumber, bloodGroup, city, dateOfBirth, gender, canDonateBlood, about });
    return res.status(StatusCodes.OK).send(new ApiResponse(StatusCodes.OK, ADD_SUCCESS_MESSAGES, profile))
});



export const medicalInfo = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "No user found");
    }
    

    const requiredFields = [ "diabetes", "headOrLungsProblem", "recentCovid", "cancerHistory", "hivAidsTest", "recentVaccination" ];
    validateFields(req.body, requiredFields);

    const { diabetes, headOrLungsProblem, recentCovid, cancerHistory, hivAidsTest, recentVaccination } = req.body;

    let donar = await Donar.findOne({ _id: userId });
    if (!donar) {
        donar = new Donar({ _id: userId });
    }

    donar.medicalInformation = { diabetes, headOrLungsProblem, recentCovid, cancerHistory, hivAidsTest, recentVaccination };
    await donar.save();

    res.status(StatusCodes.OK).send(new ApiResponse(StatusCodes.OK, ADD_SUCCESS_MESSAGES));
});



export const donationRequest = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "No user found");
    }

    const requiredFields = [ "donarName", "bloodGroup", "amount", "age","date", "hospitalName", "location", "contactPersonName", "mobileNumber", "city", "startTime", "endTime", "reason",  ];
    validateFields(req.body, requiredFields);

    const { donarName, bloodGroup, amount, age, date, hospitalName, location, contactPersonName, mobileNumber, city, startTime, endTime, reason, donateTo } = req.body;

    const donar = await Donar.findOne({ _id: userId });
    if (!donar) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Donor not found");
    }

    donar.requests = { donarName, bloodGroup, amount, age, date, hospitalName, location, contactPersonName, mobileNumber, city, startTime, endTime, reason, donateTo };
    
    await donar.save();

    res.status(StatusCodes.OK).send( new ApiResponse(StatusCodes.OK, ADD_SUCCESS_MESSAGES));
});
