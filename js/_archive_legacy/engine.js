import { $, _haversineKm, _formatMinutes, _parseTimeParts, _formatTo12h } from './utils.js';
import { CORE_REGIMEN, WEATHER_CODES } from './config.js';
import { _mountSurface, _updateWeatherUI } from './ui.js';
import { saveScheduleToDB } from './supabase.js';

export async function _handleCompile(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const payload = Object.fromEntries(data.entries());

    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = 'Synthesizing with AI...';
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true;
    }

    let itinerary = [];
    let insights = [];
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            console.warn('Gemini API key missing. Falling back to local offline generation.');
            itinerary = _synthesizeItinerary(payload);
            insights = _generateTelemetryLogs(payload);
        } else {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const foodPref = localStorage.getItem('wftd_food') || 'No specific dietary restrictions';
            const userJob = localStorage.getItem('wftd_job') || 'Professional';
            const startLocName = $('#loc-hidden-name')?.value || 'Bangkok';
            const startLat = $('#loc-hidden-lat')?.value || 13.7563;
            const startLon = $('#loc-hidden-lon')?.value || 100.5018;

            let ocrText = "";
            const fileInput = $('#pdf-upload-input');
            if (fileInput && fileInput.files.length > 0) {
                // Placeholder for future OCR/Mistral PDF processing
                ocrText = `\n[FILE ATTACHED: ${fileInput.files[0].name}] — OCR API integration pending.`;
            }

            const weatherContext = await _getWeatherContext(startLat, startLon);
            const prompt = _constructCompilePrompt(payload, userJob, foodPref, startLocName, startLat, startLon, weatherContext, ocrText);

            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
                })
            });

            if (!response.ok) {
                const errBody = await response.json();
                throw new Error(`Gemini API error: ${response.status} — ${errBody?.error?.message || 'unknown'}`);
            }
            const raw = await response.json();
            const content = raw.candidates[0].content.parts[0].text.trim();
            let cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            let parsedData;
            try {
                parsedData = JSON.parse(cleanJson);
            } catch {
                const lastBrace = cleanJson.lastIndexOf('}');
                if (lastBrace !== -1) {
                    cleanJson = cleanJson.substring(0, lastBrace + 1) + (cleanJson.startsWith('[') ? ']' : '}');
                    parsedData = JSON.parse(cleanJson);
                } else throw new Error('Could not recover truncated JSON from Gemini response');
            }
            if (Array.isArray(parsedData)) itinerary = parsedData;
            else if (parsedData.itinerary) {
                itinerary = parsedData.itinerary;
                if (parsedData.insights) insights = parsedData.insights;
            }
        }
    } catch (err) {
        console.error('Gemini AI Error:', err);
        alert(`AI generation failed: ${err.message}\n\nFalling back to local generator.`);
        itinerary = _synthesizeItinerary(payload);
        insights = _generateTelemetryLogs(payload);
    }

    if (!insights || insights.length === 0) insights = _generateTelemetryLogs(payload);

    const today = new Date().toDateString();
    localStorage.setItem('wftd_today_date', today);
    localStorage.setItem('wftd_today_schedule', JSON.stringify({ state: payload, itinerary, insights }));

    // Optional: Save to Supabase Cloud
    const alias = localStorage.getItem('wftd_alias') || 'Guest';
    saveScheduleToDB(alias, { state: payload, itinerary, insights });

    if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.style.opacity = '1';
        submitBtn.disabled = false;
    }
    _mountSurface(payload, itinerary, insights);
}

export function _synthesizeItinerary(payload) {
    const { directive, entities, location, capital, eod } = payload;
    let raw = [];
    let baseLoc = 'Local Library / Desk', meetLoc = 'Coffee Shop / Office', locTips = [];
    const savedFood = localStorage.getItem('wftd_food') || '';

    if (location) {
        const l = location.toLowerCase();
        if (l.includes('cafe')) {
            baseLoc = location; meetLoc = location;
            locTips = [{ l: 'Transport', v: `Local BTS/Walk` }, { l: 'Wifi', v: 'Variable' }, { l: 'Plugs', v: 'Arrive early' }];
        } else if (l.includes('home')) {
            baseLoc = 'Home Base'; meetLoc = 'Virtual / Zoom';
            locTips = [{ l: 'Wifi', v: 'Stable' }];
        } else { baseLoc = location; meetLoc = location; }
    }

    const cap = parseInt(capital, 10) || 0;
    raw.push({ time: '8:30 AM', t: 'Start Goal', d: `Focusing on: "${directive}"`, cat: 'work', dr: '30m', loc: baseLoc, tips: locTips });

    if (entities) {
        const entityList = entities.split(',').map(s => s.trim()).filter(s => s);
        let currentMeetingHour = 10;
        entityList.forEach((entity) => {
            const specificAgenda = payload[`agenda_${entity}`], generalAgenda = payload.agenda_general;
            const agenda = specificAgenda !== undefined ? specificAgenda : generalAgenda;
            const meetingDesc = agenda ? `Agenda: ${agenda}` : 'Alignment sync.';
            const meetCost = cap > 200 ? 120 : (cap > 0 ? 60 : 0);
            const tStr = currentMeetingHour >= 12 ? `${currentMeetingHour === 12 ? 12 : currentMeetingHour - 12}:00 PM` : `${currentMeetingHour}:00 AM`;
            const costRange = meetCost > 0 ? `${Math.floor(meetCost * 0.8)}-${Math.ceil(meetCost * 1.5)} THB` : null;
            raw.push({ time: tStr, t: `Meeting with ${entity}`, d: meetingDesc, cat: 'meet', dr: '1h', loc: meetLoc, cost: meetCost, cost_range: costRange, tips: locTips });
            currentMeetingHour += 1;
        });
        const postMeetStr = currentMeetingHour >= 12 ? `${currentMeetingHour === 12 ? 12 : currentMeetingHour - 12}:30 PM` : `${currentMeetingHour}:30 AM`;
        raw.push({ time: postMeetStr, t: 'Post-Meeting Work', d: 'Action items processing.', cat: 'work', dr: '1.5h', loc: baseLoc });
    } else {
        raw.push({ time: '9:00 AM', t: 'Focus Block', d: `Uninterrupted time for: ${directive}`, cat: 'work', dr: '3.5h', loc: baseLoc, tips: locTips });
    }

    let lunchData = 'Lunch break and reset.';
    if (cap > 0 && cap < 50) lunchData = 'Street food or packing lunch to save budget.';
    else if (savedFood) lunchData = `Enjoying a spot that suits your ${savedFood} preference.`;

    const lunchCost = cap > 500 ? 450 : (cap > 0 ? 120 : 0);
    const lunchRange = lunchCost > 0 ? `${Math.floor(lunchCost * 0.8)}-${Math.ceil(lunchCost * 1.5)} THB` : null;
    raw.push({ time: '1:00 PM', t: 'Lunch Break', d: lunchData, cat: 'leisure', dr: '1h', loc: `Local Bangkok Eatery`, cost: lunchCost, cost_range: lunchRange });
    raw.push({ time: '2:00 PM', t: 'Secondary Tasks', d: 'Clearing intermediate tasks.', cat: 'work', dr: '2.5h', loc: baseLoc, tips: locTips });
    const standardizedEod = _formatTo12h(eod) || '5:00 PM';
    raw.push({ time: standardizedEod, t: 'Wind Down', d: 'End of work day. Hard stop.', cat: 'leisure', dr: 'EOD' });
    return raw;
}

export function _generateTelemetryLogs(payload) {
    const logs = [
        `Synthesizing engine for: ${payload.directive}`,
        `Optimizing for ${payload.capital || 0} THB budget`,
        `Mapping ${payload.entities ? payload.entities.split(',').length : 0} interactions`,
        `Tailoring to ${localStorage.getItem('wftd_job') || 'Professional'} workflow`
    ];
    return logs;
}

export function _constructCompilePrompt(payload, userJob, foodPref, startLocName, startLat, startLon, weatherContext, ocrText = "") {
    const memory = localStorage.getItem('wftd_memory') || '';
    const startLocClause = (startLat && startLon) ? `\nUser's STARTING LOCATION: "${startLocName}" (lat: ${startLat}, lon: ${startLon}). ${weatherContext}` : `\nUser's location: ${startLocName}, Bangkok. ${weatherContext}`;
    const notesClause = payload.notes ? `\n\nExtra instructions: ${payload.notes}` : '';
    const ocrClause = ocrText ? `\n\nPDF Schedule Context: ${ocrText}` : '';
    const memoryClause = memory ? `\n\nUser's Long-Term Memory / Habits: ${memory}` : '';
    return `You are a creative personal scheduler for a user in Bangkok. Return ONLY raw JSON.
Format: {"itinerary": [{"time":"9:00 AM","t":"Task","d":"Desc","cat":"work","dr":"2h","loc":"Place", "cost": 500}], "insights": ["tip1", "tip2"]}
User data: ${JSON.stringify(payload)}${notesClause}${memoryClause}${startLocClause}${ocrClause}`;
}

export async function _getWeatherContext(lat = 13.7563, lon = 100.5018) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m&daily=precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=1`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,us_aqi`;
        const aqiRes = await fetch(aqiUrl);
        const aqiData = await aqiRes.json();
        const cur = weatherData.current, daily = weatherData.daily, curAqi = aqiData.current;
        const desc = WEATHER_CODES[cur.weather_code] || "Variable", temp = Math.round(cur.temperature_2m), rainProb = daily.precipitation_probability_max[0] || 0, pm25 = Math.round(curAqi.pm2_5), usAqi = curAqi.us_aqi;
        _updateWeatherUI(temp, desc, pm25, usAqi, rainProb);
        return `Weather: ${desc}, ${temp}°C. PM2.5: ${pm25}. Rain: ${rainProb}%.`;
    } catch (e) { return "Weather unavailable."; }
}

let trackingInterval;
export function _startLiveTracking() {
    if (trackingInterval) clearInterval(trackingInterval);
    const checkTimeStates = () => {
        const now = new Date(), currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();
        const nodes = document.querySelectorAll('.track-node');
        nodes.forEach((node, idx) => {
            const data = JSON.parse(node.dataset.info || '{}');
            if (!data.time) return;
            const parts = _parseTimeParts(data.time);
            if (!parts) return;
            const nodeTotalMinutes = (parts.hours * 60) + parts.minutes;
            let nextNodeMinutes = 24 * 60;
            if (idx + 1 < nodes.length) {
                const nextData = JSON.parse(nodes[idx + 1].dataset.info || '{}');
                const nextParts = _parseTimeParts(nextData.time);
                if (nextParts) {
                    nextNodeMinutes = (nextParts.hours * 60) + nextParts.minutes;
                }
            }
            node.classList.remove('status-past', 'status-active');
            if (currentTotalMinutes >= nodeTotalMinutes && currentTotalMinutes < nextNodeMinutes) node.classList.add('status-active');
            else if (currentTotalMinutes >= nextNodeMinutes) node.classList.add('status-past');
        });
    };
    checkTimeStates(); trackingInterval = setInterval(checkTimeStates, 60000);
}

export function _requestGeolocation(onSuccess) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
        window.userGeoLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        onSuccess();
    }, () => {
        window.userGeoLocation = { lat: 13.7563, lon: 100.5018 };
        onSuccess();
    }, { timeout: 8000 });
}

export function _renderTransportOptions(destLat, destLon, destName) {
    const container = $('#modal-transport-container');
    container.classList.remove('hide');
    $('#modal-transport-options').innerHTML = '<span>Detecting...</span>';
    const locateBtn = $('#transport-locate-btn');
    if (locateBtn) locateBtn.onclick = () => _requestGeolocation(() => _buildTransportCards(destLat, destLon, destName));
    if (window.userGeoLocation) _buildTransportCards(destLat, destLon, destName);
    else _requestGeolocation(() => _buildTransportCards(destLat, destLon, destName));
}

export function _buildTransportCards(destLat, destLon, destName) {
    const userLoc = window.userGeoLocation; if (!userLoc) return;
    const roadKm = _haversineKm(userLoc.lat, userLoc.lon, destLat, destLon) * 1.4;
    const modes = [
        { icon: '🚶', label: 'Walk', kmh: 4.5, gmMode: 'walking', extra: 0 },
        { icon: '🚇', label: 'BTS/MRT', kmh: 28, gmMode: 'transit', extra: 10 },
        { icon: '🚗', label: 'Grab', kmh: 18, gmMode: 'driving', extra: 5 },
        { icon: '🛵', label: 'Motorbike', kmh: 22, gmMode: 'driving', extra: 0 },
    ];
    const gmBase = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destName)}&origin=${userLoc.lat},${userLoc.lon}`;
    $('#modal-transport-options').innerHTML = modes.map(m => {
        const mins = (roadKm / m.kmh) * 60 + m.extra;
        return `<a class="transport-card" href="${gmBase}&travelmode=${m.gmMode}" target="_blank">
            <span>${m.icon} ${m.label}</span>
            <span>${_formatMinutes(mins)}</span>
        </a>`;
    }).join('');
    const link = $('#modal-directions-link'); link.href = gmBase; link.classList.remove('hide');
}
