/** Normalize Donar.requests from DB (array or legacy single object). */
export function listRequests(raw) {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "object" && raw.donarName) return [raw];
    return [];
}

export function serializeEmbeddedRequest(r) {
    if (!r) return null;
    return typeof r.toObject === "function" ? r.toObject({ flattenMaps: true }) : { ...r };
}
