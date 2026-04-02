import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { sendEmailLink } from "../utils/sendEmail.js";

export const signup = asyncHandler(async(req, res) => {
    // Validate required fields
    const { userName, email, password } = req.body;
    if ([userName, email, password].some((field) => typeof field !== "string" || field.trim() === "")) {
        return res.status(StatusCodes.BAD_REQUEST).send({status: StatusCodes.BAD_REQUEST, message: "Fields required"});
    };

    // Check if the user already exists
    const isUserExist = await User.findOne({ $or: [{ userName }, { email }] });
    if (isUserExist) {
        return res.status(StatusCodes.CONFLICT).send({status: StatusCodes.CONFLICT, message: "User alredy exist"});
    };

    await User.create({ userName, email, password });
    res.status(StatusCodes.CREATED).send({ status: true, message: "User created successfully" });
});


export const login = asyncHandler(async(req, res) => {
    // Validate required fields
    const { email, password } = req.body;
    if ([email, password].some((field) => typeof field !== "string" || field.trim() === "")) {
        return res.status(StatusCodes.BAD_REQUEST).send({status: StatusCodes.BAD_REQUEST, message: "Fields required"});
    };

    const user = await User.findOne({email});
    if(!user){
        return res.status(StatusCodes.NOT_FOUND).send({status: StatusCodes.NOT_FOUND, message: "User not found"});
    };

    const isPaswordValid = await user.isPasswordCorrect(password);
    if (!isPaswordValid) {
        return res.status(StatusCodes.UNAUTHORIZED).send({status: StatusCodes.NOT_FOUND, message: "Incorrect Password"});
    };

    res.status(StatusCodes.OK).send({ status: true, message: "User login successfully" });
});


export const forgotPassword = asyncHandler(async(req, res) => {
    // Validate required fields
    const { email } = req.body;
    if (!email) {
        return res.status(StatusCodes.BAD_REQUEST).send({status: StatusCodes.BAD_REQUEST, message: "Email required"});
    };

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).send({status: StatusCodes.NOT_FOUND, message: "User not found"});
    };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.code = code;
    user.codeExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await sendEmailLink(email, code);

    await user.save();
    
    res.status(StatusCodes.OK).send({ status: true, message: "Verification code sent to email" });
});


export const changeCurrentPassword = asyncHandler(async(req, res) => {
    // Validate required fields
    const { email, newPassword, code } = req.body;
    if (!email || !newPassword || !code) {
        return res.status(StatusCodes.BAD_REQUEST).send({status: StatusCodes.BAD_REQUEST, message: "Fields required"});
    };    

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).send({status: StatusCodes.NOT_FOUND, message: "User not found"});
    };

    if (user.code !== code) {
        return res.status(StatusCodes.BAD_REQUEST).send({status: StatusCodes.BAD_REQUEST, message: "Invalid Code"});
    };

    if(user.codeExpire < Date.now()){
        return res.status(StatusCodes.BAD_REQUEST).send({status: StatusCodes.BAD_REQUEST, message: "Code expired"});
    };

    user.password = newPassword;
    user.code = '';
    user.codeExpire = '';
    
    await user.save();

    res.status(StatusCodes.OK).send({ status: true, message: "Password Change successfully" });
});
