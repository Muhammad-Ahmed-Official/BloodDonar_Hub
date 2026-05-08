import cron from "node-cron";
import { BloodRequest } from "../models/bloodRequest.model.js";
import { Donar } from "../models/donar.models.js";
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
// 30 minutes before the end of their donation window.
// Uses per-donor reminderSent flag so replacement donors always receive reminders.
async function runReminderJob(io) {
    try {
        const now = new Date();

        const requests = await BloodRequest.find({
            status: "in_progress",
            "donors.status": "accepted",
        });

        for (const request of requests) {
            // Prefer precomputed expiresAt; fall back to parsing donationWindow
            const expiresAt = request.expiresAt
                || parseTimeOnDate(request.donationDate, request.donationWindow?.endTime);
            if (!expiresAt) continue;

            const reminderAt = new Date(expiresAt.getTime() - 30 * 60 * 1000);
            if (now < reminderAt || now >= expiresAt) continue;

            // Send reminder only to accepted donors who haven't been reminded yet
            const needsReminder = request.donors.filter(
                (d) => d.status === "accepted" && !d.reminderSent
            );
            if (needsReminder.length === 0) continue;

            await sendConfirmationReminders(request, needsReminder);

            // Mark each reminded donor atomically
            for (const donorEntry of needsReminder) {
                await BloodRequest.updateOne(
                    { _id: request._id, "donors._id": donorEntry._id },
                    { $set: { "donors.$.reminderSent": true } }
                );
            }

            // Also set request-level flag for backward compat queries
            await BloodRequest.findByIdAndUpdate(request._id, { reminderSent: true });
            console.log(`[ReminderJob] Sent reminder for request ${request._id}`);
        }
    } catch (err) {
        console.error("[ReminderJob] Error:", err.message);
    }
}

async function sendConfirmationReminders(request, donorEntries) {
    for (const donorEntry of donorEntries) {
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
// Auto-cancels in_progress requests where the donation window ended 2+ hours ago
// and no donor has confirmed completion.
// Does NOT require reminderSent — expired requests are cancelled regardless.
async function runAutoCancelJob(io) {
    try {
        const now = new Date();

        const requests = await BloodRequest.find({
            status: "in_progress",
        });

        for (const request of requests) {
            const expiresAt = request.expiresAt
                || parseTimeOnDate(request.donationDate, request.donationWindow?.endTime);
            if (!expiresAt) continue;

            // Auto-cancel 2 hours after window end with no confirmed donation
            const autoCancelAt = new Date(expiresAt.getTime() + 2 * 60 * 60 * 1000);
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

// ─── JOB 3: Donar Model Cleanup ───────────────────────────────────────────────
// Runs daily at 02:00 AM.
// Removes completed / cancelled Donar request items AND items whose blood
// donation window ended more than 2 hours ago.
async function runDonarCleanupJob() {
    try {
        const now = new Date();

        const donars = await Donar.find({
            "requests.0": { $exists: true },
        });

        let removedTotal = 0;

        for (const donar of donars) {
            const before = donar.requests.length;

            donar.requests = donar.requests.filter((r) => {
                // Always remove completed or cancelled
                if (r.status === "completed" || r.status === "cancelled") return false;

                // Remove if donation window has expired (date + endTime + 2 h buffer)
                if (r.date && r.endTime) {
                    const combined = new Date(`${r.date} ${r.endTime}`);
                    if (!isNaN(combined.getTime())) {
                        const expiry = new Date(combined.getTime() + 2 * 60 * 60 * 1000);
                        if (now > expiry) return false;
                    }
                }

                return true;
            });

            if (donar.requests.length < before) {
                removedTotal += before - donar.requests.length;
                await donar.save();
            }
        }

        console.log(`[DonarCleanup] Removed ${removedTotal} expired/closed request items`);
    } catch (err) {
        console.error("[DonarCleanup] Error:", err.message);
    }
}

// ─── START ALL JOBS ───────────────────────────────────────────────────────────
export function startReminderJob(io) {
    // Every 30 minutes — donation reminder
    cron.schedule("*/30 * * * *", () => {
        console.log("[Jobs] Running donation reminder check…");
        runReminderJob(io);
    });

    // Every 60 minutes — auto-cancel BloodRequests
    cron.schedule("0 * * * *", () => {
        console.log("[Jobs] Running auto-cancel check…");
        runAutoCancelJob(io);
    });

    // Daily at 02:00 AM — clean up expired/completed Donar requests
    cron.schedule("0 2 * * *", () => {
        console.log("[Jobs] Running Donar request cleanup…");
        runDonarCleanupJob();
    });

    console.log("[Jobs] Reminder (30 min), auto-cancel (60 min), and Donar cleanup (2 AM) jobs started");
}
