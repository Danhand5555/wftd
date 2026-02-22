export const $ = (s) => document.querySelector(s);
export const $$ = (s) => document.querySelectorAll(s);

/**
 * Unified Time Parser
 * Input: "9:00 AM", "13:30", "0930"
 * Output: { hours, minutes, ampm } 24h normalized
 */
export function _parseTimeParts(timeStr) {
    if (!timeStr) return null;
    let hours = 0, minutes = 0, ampm = 'AM';

    const match12h = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match12h) {
        hours = parseInt(match12h[1], 10);
        minutes = parseInt(match12h[2], 10);
        ampm = match12h[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
    } else if (timeStr.includes(':')) {
        const [h, m] = timeStr.split(':');
        hours = parseInt(h, 10);
        minutes = parseInt(m, 10);
    } else {
        // Handle "0900" or "1330"
        hours = parseInt(timeStr.substring(0, timeStr.length - 2), 10);
        minutes = parseInt(timeStr.substring(timeStr.length - 2), 10);
    }

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
