import nodemailer from "nodemailer";
import { SEND_EMAIL_CODE } from "../email/template.js";
const emailConfig = {
    service: "gmail",
    auth: {
        user: process.env.PORTAL_EMAIL,
        pass: process.env.PORTAL_PASSWORD,
    },
};

async function sendEmailOTP(mail, otp) {
    const mailOptions = {
        from: `"Blood Donor Hub" <${process.env.PORTAL_EMAIL}>`,
        to: mail,
        subject: "Blood Donor Hub OTP",
        html: SEND_EMAIL_CODE(otp),
    };

    try {
        await transporter.sendMail(mailOptions);
        return `OTP sent to ${mail}`;
    } catch (error) {
        console.error("SMTP ERROR FULL:", error); // don’t hide it
        throw new Error(
            `Error sending OTP: ${error?.message || error}`
        );
    }
}

export { sendEmailOTP }