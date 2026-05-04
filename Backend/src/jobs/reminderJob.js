import cron from "node-cron";
import { BloodRequest } from "../models/bloodRequest.model.js";
import { User } from "../models/user.model.js";
import { notifyDonorConfirmation } from "../services/notification.service.js";

/**
 * Parse "HH:mm" string into a Date on the same calendar day as baseDate.
 * Returns null if inputs are invalid.
 */
function parseTimeOnDate(baseDate, timeStr) {
    if (!baseDate || !timeStr) return null;
    const parts = String(timeStr).split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const d = new Date(baseDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
}

// ─── JOB 1: Donation Reminder ─────────────────────────────────────────────────
// Runs every 30 minutes.
// Sends "Did you donate blood?" push to accepted donors when we're within
// the 30-minute window before the end of their donation time window.
async function runReminderJob(io) {
    try {
        const now = new Date();

        const requests = await BloodRequest.find({
            status: "in_progress",
            reminderSent: false,
            "donors.status": "accepted",
        });

        for (const request of requests) {
            const endTime = parseTimeOnDate(request.donationDate, request.donationWindow?.endTime);
            if (!endTime) continue;

            // Reminder fires 30 min before window end
            const reminderAt = new Date(endTime.getTime() - 30 * 60 * 1000);

            // Fire if we are past reminderAt but the window has not ended yet
            // (gives a ±30 min window matching the cron interval)
            if (now >= reminderAt && now < endTime) {
                await sendConfirmationReminders(request);
                await BloodRequest.findByIdAndUpdate(request._id, { reminderSent: true });
                console.log(`[ReminderJob] Sent reminder for request ${request._id}`);
            }
        }
    } catch (err) {
        console.error("[ReminderJob] Error:", err.message);
    }
}

async function sendConfirmationReminders(request) {
    const acceptedDonors = request.donors.filter((d) => d.status === "accepted");
    for (const donorEntry of acceptedDonors) {
        try {
            const user = await User.findById(donorEntry.donor).select("expoPushToken");
            if (user?.expoPushToken) {
                await notifyDonorConfirmation(
                    user.expoPushToken,
                    request._id,
                    donorEntry.donor
                );
            }
        } catch (err) {
            console.error(`[ReminderJob] Push failed for donor ${donorEntry.donor}:`, err.message);
        }
    }
}

// ─── JOB 2: Auto-Cancel ───────────────────────────────────────────────────────
// Runs every 60 minutes.
// Auto-cancels requests where the donation window has ended + 2 hours have passed
// and no donor has confirmed completion.
async function runAutoCancelJob(io) {
    try {
        const now = new Date();

        const requests = await BloodRequest.find({
            status: "in_progress",
            reminderSent: true,
        });

        for (const request of requests) {
            const endTime = parseTimeOnDate(request.donationDate, request.donationWindow?.endTime);
            if (!endTime) continue;

            // Auto-cancel 2 hours after the window ends with no confirmation
            const autoCancelAt = new Date(endTime.getTime() + 2 * 60 * 60 * 1000);
            if (now < autoCancelAt) continue;

            const anyCompleted = request.donors.some((d) => d.status === "completed");
            if (anyCompleted) continue; // at least one donor donated — do not cancel

            // Cancel all non-finalized donors
            request.donors.forEach((d) => {
                if (!["completed", "rejected", "cancelled"].includes(d.status)) {
                    d.status = "cancelled";
                }
            });
            request.status = "cancelled";
            await request.save();

            console.log(`[AutoCancelJob] Auto-cancelled request ${request._id}`);

            // Real-time: notify receiver
            io.to(String(request.createdBy)).emit("requestUpdated", {
                requestId: String(request._id),
                status: "cancelled",
                event: "auto_cancelled",
            });

            // Real-time: notify each assigned donor
            request.donors.forEach((d) => {
                io.to(String(d.donor)).emit("requestUpdated", {
                    requestId: String(request._id),
                    donorStatus: "cancelled",
                    event: "auto_cancelled",
                });
            });
        }
    } catch (err) {
        console.error("[AutoCancelJob] Error:", err.message);
    }
}

// ─── START BOTH JOBS ──────────────────────────────────────────────────────────
export function startReminderJob(io) {
    // Every 30 minutes
    cron.schedule("*/30 * * * *", () => {
        console.log("[Jobs] Running donation reminder check…");
        runReminderJob(io);
    });

    // Every 60 minutes (at the top of each hour)
    cron.schedule("0 * * * *", () => {
        console.log("[Jobs] Running auto-cancel check…");
        runAutoCancelJob(io);
    });

    console.log("[Jobs] Donation reminder (30 min) and auto-cancel (60 min) jobs started");
}
