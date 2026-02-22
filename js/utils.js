export const $ = (s) => document.querySelector(s);
export const $$ = (s) => document.querySelectorAll(s);

/**
 * Unified Time Parser (Human-Friendly)
 * Handles: "9", "9:30", "9.30", "0930", "9am", "17:00", etc.
 * Output: { hours, minutes, ampm } 24h normalized
 */
export function _parseTimeParts(timeStr) {
    if (!timeStr) return null;
    let s = timeStr.trim().toUpperCase().replace(/\s+/g, '');

    const isPM = s.includes('PM');
    const isAM = s.includes('AM');
    s = s.replace(/(AM|PM)/g, '');

    let hours = 0, minutes = 0;

    // Pattern to catch hours and optional minutes
    // Supports 9, 9:30, 9.30, 930, 1745, etc.
    const match = s.match(/^(\d+)(?:[:.](\d+))?$/);
    if (match) {
        let hRaw = match[1];
        let mRaw = match[2];

        if (mRaw !== undefined) {
            hours = parseInt(hRaw, 10);
            minutes = parseInt(mRaw, 10);
        } else if (hRaw.length >= 3) {
            minutes = parseInt(hRaw.slice(-2), 10);
            hours = parseInt(hRaw.slice(0, -2), 10);
        } else {
            hours = parseInt(hRaw, 10);
            minutes = 0;
        }
    } else {
        return null;
    }

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    if (isNaN(hours) || isNaN(minutes)) return null;

    // Final clamp to valid time
    hours = Math.min(23, Math.max(0, hours));
    minutes = Math.min(59, Math.max(0, minutes));

    return { hours, minutes, ampm: hours >= 12 ? 'PM' : 'AM' };
}

export const _formatTo12h = (timeStr) => {
    const parts = _parseTimeParts(timeStr);
    if (!parts) return '';

    const displayH = parts.hours % 12 || 12;
    const displayM = parts.minutes.toString().padStart(2, '0');
    return `${displayH}:${displayM} ${parts.hours >= 12 ? 'PM' : 'AM'}`;
};

export function _haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function _formatMinutes(mins) {
    const m = Math.round(mins);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
}
