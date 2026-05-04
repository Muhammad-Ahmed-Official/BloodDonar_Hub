import nodemailer from "nodemailer";
import { SEND_EMAIL_CODE } from "../email/template.js";

// Gmail App Passwords are displayed with spaces for readability but must be sent without them
const appPassword = (process.env.PORTAL_PASSWORD || "").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.PORTAL_EMAIL,
        pass: appPassword,
    },
    connectionTimeout: 10000,  // fail fast if Gmail SMTP unreachable (default is 2 min)
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

async function sendEmailOTP(mail, otp) {
    const mailOptions = {
        from: `"Blood Donor Hub" <${process.env.PORTAL_EMAIL}>`,
        to: mail,
        subject: "Your OTP Code",
        html: SEND_EMAIL_CODE(otp),
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error(`Failed to send OTP email: ${error?.message || error}`);
    }
}

export { sendEmailOTP };
