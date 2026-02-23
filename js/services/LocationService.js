import { $ } from '../utils.js';
import { _haversineKm, _formatMinutes } from '../utils.js';
import { store } from '../store/index.js';

export async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        const addr = data.address || {};
        return addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.city || addr.county || 'Bangkok';
    } catch (_) { return 'Bangkok'; }
}

export function requestGeolocation(onSuccess, onError) {
    if (!navigator.geolocation) {
        if (onError) onError();
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            store.setLocation('Current Location', lat, lon); // Will be updated by reverseGeocode later
            if (onSuccess) onSuccess(lat, lon);
        },
        () => {
            if (onError) onError();
        },
        { timeout: 8000 }
    );
}

export async function tryGeocode(query, fallbackLat, fallbackLon) {
    const lower = (query || '').toLowerCase();

    // Check for Home Base override
    if (lower.includes('home base') || lower === 'home' || lower === 'house' || lower === 'home, bangkok') {
        const loc = store.getState().location;
        return { lat: loc.lat, lon: loc.lon, display_name: `${loc.name || 'Home Base'}` };
    }

    try {
        const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${fallbackLat}&lon=${fallbackLon}&limit=1&lang=en`);
        const photonData = await photonRes.json();
        if (photonData.features && photonData.features.length > 0) {
            const [lon, lat] = photonData.features[0].geometry.coordinates;
            const props = photonData.features[0].properties;
            return { lat, lon, display_name: `${props.name || props.street || query}, ${props.city || props.state || 'Bangkok'}` };
        }
    } catch (_) { }

    try {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Bangkok, Thailand')}&format=json&limit=1&countrycodes=th`, { headers: { 'Accept-Language': 'en' } });
        const nomData = await nomRes.json();
        if (nomData && nomData[0]) return { lat: nomData[0].lat, lon: nomData[0].lon, display_name: nomData[0].display_name };
    } catch (_) { }

    return null;
}

export function getTransportOptions(startLat, startLon, destLat, destLon, destName) {
    const roadKm = _haversineKm(startLat, startLon, destLat, destLon) * 1.4;
    const modes = [
        { icon: '🚶', label: 'Walk', kmh: 4.5, gmMode: 'walking', extra: 0 },
        { icon: '🚇', label: 'BTS/MRT', kmh: 28, gmMode: 'transit', extra: 10 },
        { icon: '🚗', label: 'Grab', kmh: 18, gmMode: 'driving', extra: 5 },
        { icon: '🛵', label: 'Motorbike', kmh: 22, gmMode: 'driving', extra: 0 },
    ];
    const gmBase = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destName)}&origin=${startLat},${startLon}`;

    const optionsHtml = modes.map(m => {
        const mins = (roadKm / m.kmh) * 60 + m.extra;
        return `<a class="transport-card" href="${gmBase}&travelmode=${m.gmMode}" target="_blank">
            <span>${m.icon} ${m.label}</span>
            <span>${_formatMinutes(mins)}</span>
        </a>`;
    }).join('');

    return { html: optionsHtml, url: gmBase };
}
