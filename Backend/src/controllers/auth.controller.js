import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from 'uuid'
import { sendEmailOTP } from '../utils/sendEmail.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { responseMessages } from "../constants/responseMessages.js";
const { MISSING_FIELDS, USER_EXISTS, UN_AUTHORIZED, SUCCESS_REGISTRATION, NO_USER, SUCCESS_LOGIN, INVALID_OTP, OTP_EXPIRED, EMAIL_VERIFY, SUCCESS_LOGOUT, MISSING_FIELD_EMAIL_PASSWORD, UNAUTHORIZED_REQUEST, GET_SUCCESS_MESSAGES, RESET_LINK_SUCCESS, PASSWORD_CHANGE, NOT_VERIFY, PASSWORD_AND_CONFIRM_NO_MATCH, MISSING_FIELD_EMAIL, RESET_OTP_SECCESS, INVALID_TOKEN, TOKEN_EXPIRED, SUCCESS_TOKEN, INVALID_DATA, EMAIL_ERROR } = responseMessages

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById( userId );
        const accessToken = user.generateAccessToken();
        await user.save({validateBeforeSave: false});        
        return { accessToken };
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}


// @desc    SIGNUP
// @route   POST /api/v1/auth/signup
// @access  Public

export const signup = asyncHandler( async (req, res) => {
    const { userName, email, password } = req.body;
    if ([userName, email, password].some((field) => typeof field !== "string" || field.trim() === "")) {
        throw new ApiError(StatusCodes.BAD_REQUEST, MISSING_FIELDS);
    }
    
    const isUserExist = await User.findOne({ $or: [{ userName }, { email }] });
    if (isUserExist) {
        throw new ApiError(StatusCodes.CONFLICT, USER_EXISTS);
    }
    
    const otp = uuidv4().slice(0, 6);
    const otpExpiry = Date.now() + 600000; // OTP expires in 10 minutes
        
    const user = await User.create({
        userName: userName,
        email,
        password,
        otp,
        expiresIn: otpExpiry,
    });
    
    // Send OTP via email
    const emailResponse = await sendEmailOTP(email, otp);

    if (!emailResponse) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, EMAIL_ERROR);
    }
    
    const { accessToken } = await generateAccessAndRefreshToken(user._id);
        
    // Retrieve the created user without sensitive fields
    const createdUser = await User.findById(user._id).select("-password");
    
    if (!createdUser) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, NO_USER);
    }
    // Respond with success
    const options = {
        httpOnly: true,
        secure: true,
    }
        
    return res
    .status(StatusCodes.CREATED)
    .cookie("accessToken", accessToken, options)
    .send(new ApiResponse(StatusCodes.OK, 
        SUCCESS_REGISTRATION,
        {user: createdUser, SUCCESS_REGISTRATION },
    ))
    
})



// @desc    RESEND-OTP
// @route   POST api/v1/user/resendOtp
// @access  Private

export const resendOtp = asyncHandler( async (req, res) => {
    const { email } = req.body;
    if (!email ) {
        return res.status(StatusCodes.BAD_REQUEST).send(new ApiError(StatusCodes.BAD_REQUEST, UN_AUTHORIZED));
    }

    const isUser = await User.findOne({ email });
    if (!isUser) {
        return res.status(StatusCodes.NOT_FOUND).send(new ApiError(StatusCodes.NOT_FOUND, NO_USER));
    }

    const newOtp = uuidv4().slice(0, 6);
    isUser.otp = newOtp;
    isUser.expiresIn = Date.now() + 600000; // 10 minutes
    await isUser.save({ validateBeforeSave: false });

    await sendEmailOTP(email, newOtp);

    return res.status(StatusCodes.OK).send(new ApiResponse(StatusCodes.OK, RESET_OTP_SECCESS));
  } 
);



// @desc    VERIFY EMAIL
// @route   POST /api/user/verifyEmail
// @access  Private

export const verifyEmail = asyncHandler(async (req, res) => {
        const { otp } = req.body;
        
        // Validate the input
        if (!otp) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .send(new ApiError(StatusCodes.BAD_REQUEST, MISSING_FIELDS));
        }

        // Fetch the user

        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .send(new ApiError(StatusCodes.NOT_FOUND, NO_USER));
        }

        // Verify OTP
        if (user.otp !== otp) {
            return res
                .status(StatusCodes.FORBIDDEN)
                .send(new ApiError(StatusCodes.FORBIDDEN, INVALID_OTP));
        }

        // Check OTP expiration
        if (user.expiresIn < Date.now()) {
            return res
                .status(StatusCodes.FORBIDDEN)
                .send(new ApiError(StatusCodes.FORBIDDEN, OTP_EXPIRED));
        }

        // Mark the user as verified and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        user.expiresIn = undefined;
       // Save without validation checks
        await user.save({ validateBeforeSave: false });

        // Send success response
        return res
            .status(StatusCodes.OK)
            .send(new ApiResponse(StatusCodes.OK, EMAIL_VERIFY, { email: user.email, isVerified: user.isVerified }));
    } 
);




// @desc    SIGNIN
// @route   POST /api/v1/auth/signin
// @access  Public

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password){
        throw new ApiError(StatusCodes.BAD_REQUEST, MISSING_FIELD_EMAIL_PASSWORD);
    }
    
    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(StatusCodes.NOT_FOUND, NO_USER);
    }
    
    const isPaswordValid = await user.isPasswordCorrect(password);
    
    if (!isPaswordValid) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, UN_AUTHORIZED);
      }
      
    const { accessToken } = await generateAccessAndRefreshToken(user._id);
    

    const loggedInusers = await  User.findById(user._id).select("-password ");
    
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
    .status(StatusCodes.OK)
    .cookie("accessToken", accessToken, options)
    .send(new ApiResponse(StatusCodes.OK, 
        SUCCESS_LOGIN,
        {user: loggedInusers, SUCCESS_LOGIN },
    ))
})



// @desc    LOGOUT
// @route   POST api/v1/auth/logout
// @access  Public

export const logout = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true,
    }

    res
    .status(StatusCodes.OK)
    .clearCookie("accessToken", options)
    .send(new ApiResponse(StatusCodes.OK,  SUCCESS_LOGOUT, {}));
})


// @desc    FORGOT-PASSWORD-EMAIL
// @route   POST api/v1/auth/forgotPasswordEmail
// @access  Public

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(StatusCodes.BAD_REQUEST).send(new ApiError(StatusCodes.BAD_REQUEST, MISSING_FIELD_EMAIL));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).send(new ApiError(StatusCodes.NOT_FOUND, NO_USER_FOUND));
    }
    
    if (!user.isVerified) {
        return res.status(StatusCodes.NOT_FOUND).send(new ApiError(StatusCodes.NOT_FOUND, NOT_VERIFY));
    }
    
    const isUser = await User.findById(user._id);  // true if both ObjectIds are equal
    if (!isUser) {
        return res.status(StatusCodes.UNAUTHORIZED).send(new ApiError(StatusCodes.UNAUTHORIZED, UN_AUTHORIZED));
    }

    const otp = uuidv4().slice(0, 6);
    isUser.otp = otp;
    const emailResponse = await sendEmailOTP(email, otp);
    if (!emailResponse) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, EMAIL_ERROR);
    };

    await isUser.save()

    return res.status(StatusCodes.OK).send(new ApiResponse(StatusCodes.OK, RESET_LINK_SUCCESS));
});




// @desc    UPDATE-PASSWORD
// @route   PUT api/v1/user/resetPasswordEmail
// @access  Private

export const updatePassword = asyncHandler(async (req, res) => {
    const { newPassword, otp } = req.body;
    if (!newPassword || !otp) {
        return res.status(StatusCodes.BAD_REQUEST).send(new ApiError(StatusCodes.BAD_REQUEST, MISSING_FIELDS));
    };

    const user = await User.findOne({ otp });
    if(!user) {
        return res.status(StatusCodes.NOT_FOUND).send(new ApiError(StatusCodes.NOT_FOUND, INVALID_DATA));
    }
    
    user.password = newPassword;
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(StatusCodes.OK).send(new ApiResponse(StatusCodes.OK, PASSWORD_CHANGE, {}));
});