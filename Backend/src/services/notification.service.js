import { User } from "../models/user.model.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function clearStaleToken(token) {
    try {
        await User.updateMany({ expoPushToken: token }, { $set: { expoPushToken: null } });
        console.warn("[Push] Cleared stale/invalid token:", token);
    } catch (err) {
        console.error("[Push] Failed to clear stale token:", err.message);
    }
}

/**
 * Send a push notification via Expo's push service.
 * This is a server-to-server call — it works even when the recipient's
 * app is closed or backgrounded. Expo routes to APNs (iOS) or FCM (Android).
 *
 * Silently skips invalid/missing tokens instead of throwing.
 */
export async function sendPushNotification(token, title, body, data = {}) {
    if (!token || !String(token).startsWith("ExponentPushToken")) {
        console.warn("[Push] Skipping — invalid or missing token:", token);
        return;
    }

    const payload = {
        to: token,
        sound: "default",
        title,
        body,
        data,
        priority: "high",
        channelId: "blood-requests",
    };

    try {
        const response = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (Array.isArray(result?.data)) {
            result.data.forEach((ticket) => {
                if (ticket.status === "error") {
                    console.error("[Push] Ticket error:", ticket.message, ticket.details);
                    if (ticket.details?.error === "DeviceNotRegistered") {
                        clearStaleToken(token);
                    }
                }
            });
        }
    } catch (err) {
        console.error("[Push] Network error sending notification:", err.message);
    }
}

/**
 * Notify a donor that a blood request needs their help.
 * data.type = "BLOOD_REQUEST" — frontend opens Accept/Reject modal on tap.
 * @param {object} options - { city?: string, bloodType?: string }
 */
export async function notifyDonorBloodRequest(token, requestId, receiverId, options = {}) {
    const { city, bloodType } = options;
    const title = city ? `Blood Needed in ${city} 🩸` : "Blood Donation Request";
    const body = bloodType && city
        ? `Someone in ${city} needs ${bloodType} blood. Can you help?`
        : "A patient needs urgent blood donation. Tap to respond.";

    await sendPushNotification(token, title, body, {
        requestId: String(requestId),
        receiverId: String(receiverId),
        type: "BLOOD_REQUEST",
    });
}

/**
 * Ask donor if they completed the donation.
 * data.type = "DONATION_CONFIRMATION" — frontend opens Yes/No confirmation modal on tap.
 */
export async function notifyDonorConfirmation(token, requestId, donorId) {
    await sendPushNotification(
        token,
        "Donation Confirmation",
        "Did you donate blood successfully?",
        {
            requestId: String(requestId),
            donorId: String(donorId),
            type: "DONATION_CONFIRMATION",
        }
    );
}
