import nodemailer from "nodemailer";
import { SEND_EMAIL_CODE } from "../email/template.js";

async function sendEmailOTP(mail, otp) {
    const user = process.env.PORTAL_EMAIL;
    const pass = (process.env.PORTAL_PASSWORD || "").replace(/\s+/g, "");

    if (!user || !pass) {
        throw new Error("PORTAL_EMAIL or PORTAL_PASSWORD env var is not set.");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });

    const mailOptions = {
        from: `"Blood Donor Hub" <${user}>`,
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
