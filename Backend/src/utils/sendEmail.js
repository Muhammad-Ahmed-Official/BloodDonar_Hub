import nodemailer from "nodemailer";
import { SEND_EMAIL_CODE } from "../email/template.js";
const emailConfig = {
    service: "gmail",
    auth: {
        user: process.env.PORTAL_EMAIL,
        pass: process.env.PORTAL_PASSWORD,
    },
};

async function sendEmailLink(mail, code) { 
    const transporter = nodemailer.createTransport(emailConfig);
    const mailOptions = {
        from: process.env.PORTAL_EMAIL,
        to: mail, 
        subject: "CHANGE PASSWORD",
        html: SEND_EMAIL_CODE(code), // html body 
    };

    try {
        await transporter.sendMail(mailOptions);
        return `Code sent to ${mail} via email`;
    } catch (error) {
        throw `Error sending OTP to ${mail} via email: ${error}`;
    }
}

export { sendEmailLink }