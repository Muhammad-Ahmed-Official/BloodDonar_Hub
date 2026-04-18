import { Donar } from "../models/donar.models.js";

/**
 * One-time migration: legacy single embedded `requests` object → array of subdocuments with `status`.
 */
export async function migrateLegacyDonarRequests() {
    const docs = await Donar.find({}).lean();
    let n = 0;
    for (const doc of docs) {
        const r = doc.requests;
        if (r == null) continue;
        if (Array.isArray(r)) continue;
        if (typeof r === "object" && Object.keys(r).length === 0) {
            await Donar.updateOne({ _id: doc._id }, { $set: { requests: [] } });
            n++;
            continue;
        }
        if (typeof r === "object" && r !== null) {
            const status = r.status && ["in_progress", "completed", "cancelled"].includes(r.status) ? r.status : "in_progress";
            const { status: _s, ...rest } = r;
            await Donar.updateOne(
                { _id: doc._id },
                { $set: { requests: [{ ...rest, status }] } }
            );
            n++;
        }
    }
    if (n > 0) {
        console.log(`[migrateDonarRequests] Normalized ${n} Donar document(s) to requests[]`);
    }
}
