import { $, $$ } from './utils.js';
import { _formatTo12h } from './utils.js';
import { _getWeatherContext, _startLiveTracking, _renderTransportOptions } from './engine.js';
import { _showChat } from './chat.js';

// State
let currentStep = 1;
let activeFlow = [1, 2, 3, 4, 5, 6, 7]; // Default full flow

/**
 * Determines the adaptive workflow based on the user's initial goal using AI.
 */
export async function _determineFlow(goalText) {
    let flow = [1, 2, 4, 5, 6, 7]; // Default
    let isSocial = false, isWork = false, isLeisure = false;

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) throw new Error('No API Key');

        const prompt = `Classify this goal for a scheduling app: "${goalText}"
        Return ONLY a JSON object: {"category": "social" | "work" | "leisure" | "other"}
        - "social": meeting people, events, calls, syncs.
        - "work": focused individual tasks, coding, writing, projects.
        - "leisure": travel, exploration, rest, relaxation, hobby.
        - "other": anything else.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (res.ok) {
            const data = await res.json();
            const text = data.candidates[0].content.parts[0].text.trim().replace(/```json/g, '').replace(/```/g, '');
            const aiResult = JSON.parse(text);

            if (aiResult.category === 'social') {
                flow = [1, 2, 3, 4, 6, 7];
                isSocial = true;
            } else if (aiResult.category === 'work') {
                flow = [1, 4, 6, 7];
                isWork = true;
            } else if (aiResult.category === 'leisure') {
                flow = [1, 4, 5, 6, 7];
                isLeisure = true;
            } else {
                flow = [1, 4, 6, 7]; // Default to lean flow for "other" like sleep/rest
            }
        }
    } catch (e) {
        console.warn('AI Flow determination failed, using standard.', e);
        flow = [1, 2, 4, 5, 6, 7];
    }

    activeFlow = flow;
    _updateStepCounters();
    _tailorLabels(isWork, isLeisure, isSocial);
    return activeFlow;
}

function _tailorLabels(isWork, isLeisure, isSocial) {
    const locLabel = $('.step-card[data-step="4"] .majestic-label');
    const eodLabel = $('.step-card[data-step="6"] .majestic-label');
    const notesLabel = $('#step-7-label') || $('.step-card[data-step="7"] .majestic-label');

    if (isWork) {
        if (locLabel) locLabel.textContent = "Where's your deep work station today?";
        if (eodLabel) eodLabel.textContent = "When are you wrapping up tonight?";
        if (notesLabel) notesLabel.textContent = "Any deep work focus details?";
    } else if (isLeisure) {
        if (locLabel) locLabel.textContent = "Where's your base for exploration?";
        if (eodLabel) eodLabel.textContent = "When do you want to head back?";
        if (notesLabel) notesLabel.textContent = "Any specific places you must see?";
    } else if (isSocial) {
        if (locLabel) locLabel.textContent = "Where are you starting your day?";
        if (eodLabel) eodLabel.textContent = "When is your last networking event?";
    }
}

function _updateStepCounters() {
    activeFlow.forEach((stepNum, index) => {
        const counter = $(`.step-card[data-step="${stepNum}"] .step-counter`);
        if (counter) {
            counter.textContent = `${index + 1} of ${activeFlow.length}`;
        }
    });
}

// Step Navigation
export async function _nextStep() {
    const currentCard = $(`.step-card[data-step="${currentStep}"]`);
    const input = currentCard.querySelector('input, textarea');

    // Basic validation
    let isValid = true;
    if (currentStep === 4) {
        const locVal = $('#loc-hidden-name').value;
        if (!locVal) {
            _showFeedback('fb-location', 'Please pick a starting location first.');
            isValid = false;
        }
    } else if (input && input.required && !input.value.trim()) {
        input.focus();
        isValid = false;
    }

    if (!isValid) return;

    // Special Case: Determine flow after Step 1 using AI
    if (currentStep === 1) {
        const btn = currentCard.querySelector('.next-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Thinking...';
        btn.disabled = true;

        await _determineFlow($('textarea[name="directive"]').value);

        btn.innerHTML = originalText;
        btn.disabled = false;
    }

    const currentIndex = activeFlow.indexOf(currentStep);
    if (currentIndex !== -1 && currentIndex < activeFlow.length - 1) {
        currentCard.classList.remove('active');
        currentCard.classList.add('hidden-left');

        let nextStepNum = activeFlow[currentIndex + 1];

        // Dynamic Agenda Check (if Step 3 is in flow, but no people were added in Step 2)
        if (nextStepNum === 3) {
            const entitiesVal = $('input[name="entities"]').value.trim();
            if (!entitiesVal) {
                // Skip Agenda if no people were actually typed
                const nextNextIndex = currentIndex + 2;
                if (nextNextIndex < activeFlow.length) {
                    nextStepNum = activeFlow[nextNextIndex];
                }
            } else {
                _buildAgendaInputs(entitiesVal);
            }
        }

        currentStep = nextStepNum;
        const nextCard = $(`.step-card[data-step="${currentStep}"]`);
        nextCard.classList.remove('hidden-right');
        nextCard.classList.add('active');

        setTimeout(() => {
            const nextInput = nextCard.querySelector('input, textarea');
            if (nextInput) nextInput.focus();
        }, 400);
    }
}

export function _prevStep() {
    const currentIndex = activeFlow.indexOf(currentStep);
    if (currentIndex > 0) {
        const currentCard = $(`.step-card[data-step="${currentStep}"]`);
        currentCard.classList.remove('active');
        currentCard.classList.add('hidden-right');

        let prevStepNum = activeFlow[currentIndex - 1];

        // Dynamic Agenda Check Backward
        if (prevStepNum === 3) {
            const entitiesVal = $('input[name="entities"]').value.trim();
            if (!entitiesVal) {
                prevStepNum = activeFlow[currentIndex - 2];
            }
        }

        currentStep = prevStepNum;
        const prevCard = $(`.step-card[data-step="${currentStep}"]`);
        prevCard.classList.remove('hidden-left');
        prevCard.classList.add('active');
    }
}

export function getCurrentStep() { return currentStep; }
export function setCurrentStep(val) { currentStep = val; }
export function isLastStep() {
    const currentIndex = activeFlow.indexOf(currentStep);
    return currentIndex === activeFlow.length - 1;
}

// Dynamic Feedback Handlers
export function _showFeedback(nodeId, text) {
    const node = $(`#${nodeId}`);
    if (!node) return;
    node.textContent = text;
    if (text) {
        node.classList.add('visible');
    } else {
        node.classList.remove('visible');
    }
}

export function _handleGoalFeedback(e) {
    const val = e.target.value.trim();
    const lines = val.split(/[,\n]+/).filter(l => l.trim().length > 0).length;
    let msg = '';
    if (lines === 1) msg = 'Laser focus. Love to see it.';
    else if (lines === 2) msg = 'Double threat. Solid play. Let\'s execute.';
    else if (lines >= 3) msg = 'Absolute beast mode today. Let\'s crush it.';
    _showFeedback('fb-directive', msg);
}

export function _handleEntitiesFeedback(e) {
    const val = e.target.value.trim();
    const count = val ? val.split(',').length : 0;
    let msg = '';
    if (val.length > 0 && count === 1) msg = 'One-on-one power sync.';
    else if (count > 1) msg = 'Networking god. We\'ll balance the energy.';
    _showFeedback('fb-entities', msg);
}

export function _handleAgendaFeedback(e) {
    const val = e.target.value.trim();
    let msg = '';
    if (val.length > 0 && val.length < 15) msg = 'Short and ruthless agenda. Perfect.';
    else if (val.length >= 15) msg = 'Detailed alignment. Total clarity.';
    _showFeedback('fb-agenda', msg);
}

export function _handleBudgetFeedback(e) {
    const val = parseInt(e.target.value, 10);
    let msg = '';
    if (val === 0) msg = 'Zero spend? Respect the grind.';
    else if (val > 0 && val <= 500) msg = 'Lean operations. Smart choices.';
    else if (val > 500 && val <= 2000) msg = 'Solid budget. Real local luxury.';
    else if (val > 2000) msg = 'Big baller! Treat yourself today.';
    _showFeedback('fb-capital', msg);
}

export function _handleEodFeedback(e) {
    const val = e.target.value.trim();
    let msg = '';
    const stdTime = _formatTo12h(val);
    if (stdTime) msg = `Quitting at ${stdTime}. Locked in till then.`;
    else if (val) msg = `Format time (e.g., 9:00 PM, 21:00, 2100)`;
    _showFeedback('fb-eod', msg);
}

export async function _renderAllStepSuggestions() {
    const job = localStorage.getItem('wftd_job') || 'Professional';
    const goalContainer = $('#goal-chips-container');
    const meetContainer = $('#meet-chips-container');
    if (!goalContainer || !meetContainer) return;

    const fallbacks = {
        'finance': {
            goals: [{ label: 'Market Analysis', val: 'Execute full market analysis and risk report' }, { label: 'Risk Review', val: 'Reviewing portfolio risk and exposure' }],
            meets: [{ label: 'Risk Team', val: 'Risk Management Team' }, { label: 'LPs', val: 'Limited Partners' }, { label: 'Analysts', val: 'Equity Analysts' }]
        },
        'design': {
            goals: [{ label: 'Moodboard', val: 'Curation and visual research' }, { label: 'UI Prep', val: 'High-fidelity wireframing' }],
            meets: [{ label: 'Design Team', val: 'Design Team' }, { label: 'Product Mgr', val: 'Product Manager' }, { label: 'Dev Sync', val: 'Engineering Team' }]
        },
        'engineer': {
            goals: [{ label: 'Deep Code', val: 'Focused architecture and coding' }, { label: 'Bug Hunt', val: 'Fixing critical technical debt' }],
            meets: [{ label: 'Standup', val: 'Team Standup' }, { label: 'DevOps', val: 'DevOps Team' }, { label: 'QA Team', val: 'QA/Testing Team' }]
        },
        'default': {
            goals: [{ label: 'Deep Work', val: 'Focus on highest priority outcome' }, { label: 'Planning', val: 'Strategic planning for the week' }],
            meets: [{ label: 'Team', val: 'Core Team' }, { label: 'Manager', val: 'Manager' }, { label: 'Client', val: 'Client' }]
        }
    };

    const category = Object.keys(fallbacks).find(k => job.toLowerCase().includes(k)) || 'default';
    const initialGoals = [...fallbacks[category].goals, { label: 'Rest Day', val: 'Rest and mental recovery' }];
    const initialMeets = [...fallbacks[category].meets, { label: 'Skip (Solo)', val: '' }];

    const render = (container, list) => {
        container.innerHTML = list.map(c => `<button type="button" class="chip" data-value="${c.val}">${c.label}</button>`).join('');
    };

    render(goalContainer, initialGoals);
    render(meetContainer, initialMeets);

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) return;

        const prompt = `Generate suggestion chips for a ${job} for two steps in a scheduling app.
        Return ONLY a JSON object: {
            "goals": [{"label": "Action", "val": "Full descriptive task"}], 
            "meets": [{"label": "Who", "val": "Full name/team"}]
        }
        Generate 4 items per list. Maximum 2 words for labels.
        "meets" should be colleagues/teams/clients relevant to a ${job}.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (res.ok) {
            const data = await res.json();
            const text = data.candidates[0].content.parts[0].text.trim().replace(/```json/g, '').replace(/```/g, '');
            const aiData = JSON.parse(text);

            if (aiData.goals) {
                aiData.goals.push({ label: 'Rest Day', val: 'Rest and mental recovery' });
                render(goalContainer, aiData.goals);
            }
            if (aiData.meets) {
                aiData.meets.push({ label: 'Skip (Solo)', val: '' });
                render(meetContainer, aiData.meets);
            }
        }
    } catch (e) {
        console.warn('AI Suggestions failed', e);
    }
}

export function _buildAgendaInputs(entitiesStr) {
    const container = $('#agenda-container');
    if (!container) return;
    const entities = entitiesStr.split(',').map(s => s.trim()).filter(s => s);
    if (entities.length === 0) return;
    if (entities.length === 1) {
        container.innerHTML = `<input type="text" class="input-majestic" name="agenda_${entities[0]}" placeholder="e.g., Performance Review, Pitch..." autocomplete="off">`;
    } else {
        container.innerHTML = entities.map((name, i) => `
            <div style="margin-bottom: ${i < entities.length - 1 ? '24px' : '0'}; text-align: left;">
                <label class="type-caption" style="display:block; margin-bottom: 8px; color: var(--clr-brand); font-weight: bold; font-size: 14px;">Agenda for ${name}</label>
                <input type="text" class="input-majestic agenda-input" name="agenda_${name}" placeholder="What are you discussing?" autocomplete="off" style="font-size: clamp(20px, 3vw, 32px);">
            </div>
        `).join('');
    }
}

export function _mountSurface(state, itinerary, insights) {
    const landing = $('#landing-view');
    landing.classList.add('hide');
    landing.setAttribute('aria-hidden', 'true');

    $('#state-directive').textContent = state.directive;
    $('#stat-capital').textContent = state.capital ? `${state.capital} THB` : 'None';

    const marginNode = $('#stat-margin');
    marginNode.textContent = _formatTo12h(state.eod) || '5:00 PM';
    marginNode.previousElementSibling.textContent = 'Hard Stop';

    $('#stat-entities').textContent = state.entities || 'Solo Session';

    const logContainer = $('#system-logs');
    logContainer.innerHTML = insights.map((i, idx) => `
        <li class="insight-item">
            <span class="insight-index">0${idx + 1}</span>
            <span class="insight-text">${i}</span>
        </li>
    `).join('');

    const track = $('#timeline-root');
    track.innerHTML = itinerary.map((node, i) => `
        <article class="track-node" data-index="${i}" style="animation-delay: ${i * 0.12}s; cursor: pointer;" data-info="${JSON.stringify(node).replace(/"/g, '&quot;')}">
            <time class="node-meta">${_formatTo12h(node.time)}</time>
            <div class="node-surface">
                <h3>${node.t}</h3>
                <p>${node.d}</p>
                <div class="pill-cluster">
                    <span class="data-pill pill-${node.cat}">${node.cat}</span>
                    <span class="data-pill">TR: ${node.dr}</span>
                    ${node.loc ? '<span class="data-pill">📍 Map</span>' : ''}
                    ${typeof node.cost === 'number' && node.cost > 0 ? '<span class="data-pill val-green">$$</span>' : ''}
                </div>
            </div>
        </article>
    `).join('');

    setTimeout(() => {
        const surface = $('#app-surface');
        surface.classList.remove('hide');
        surface.removeAttribute('aria-hidden');
        const lat = $('#loc-hidden-lat')?.value || 13.7563;
        const lon = $('#loc-hidden-lon')?.value || 100.5018;
        _getWeatherContext(lat, lon);
        _startLiveTracking();
        _showChat();
    }, 300);
}

export function _bindModalEvents() {
    _bindProfileEvents();
    $('#timeline-root').addEventListener('click', (e) => {
        const nodeEl = e.target.closest('.track-node');
        if (!nodeEl) return;
        try {
            const data = JSON.parse(nodeEl.dataset.info || '{}');
            const idx = nodeEl.dataset.index;
            _openDetailModal(data, idx);
        } catch (err) { console.error('Failed to parse node data', err); }
    });

    $('#modal-close-btn').addEventListener('click', _closeDetailModal);
    $('#schedule-modal').addEventListener('click', (e) => { if (e.target.id === 'schedule-modal') _closeDetailModal(); });

    $('#modal-edit-btn').addEventListener('click', () => {
        const btn = $('#modal-edit-btn');
        const isEditing = btn.textContent === 'Save';
        const title = $('#modal-title'), desc = $('#modal-desc'), time = $('#modal-time'), duration = $('#modal-duration');

        if (!isEditing) {
            btn.textContent = 'Save';
            btn.classList.add('val-green');
            [title, desc, time, duration].forEach(el => { el.contentEditable = true; el.classList.add('editable-input'); });
            title.focus();
        } else {
            btn.textContent = 'Edit';
            btn.classList.remove('val-green');
            [title, desc, time, duration].forEach(el => { el.contentEditable = false; el.classList.remove('editable-input'); });
            try {
                const idx = $('#schedule-modal').dataset.editIndex;
                const saved = JSON.parse(localStorage.getItem('wftd_today_schedule'));
                if (saved && saved.itinerary && saved.itinerary[idx]) {
                    saved.itinerary[idx].t = title.textContent.trim();
                    saved.itinerary[idx].d = desc.textContent.trim();
                    saved.itinerary[idx].time = time.textContent.trim();
                    saved.itinerary[idx].dr = duration.textContent.trim();
                    localStorage.setItem('wftd_today_schedule', JSON.stringify(saved));
                    _mountSurface(saved.state || {}, saved.itinerary, saved.insights || []);
                }
            } catch (err) { console.error('Error saving edits', err); }
            _closeDetailModal();
        }
    });
}

export function _bindProfileEvents() {
    const openBtn = $('#profile-open-btn');
    const closeBtn = $('#profile-close-btn');
    const saveBtn = $('#profile-save-btn');
    const modal = $('#profile-modal');

    if (!modal) return;

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            $('#profile-alias').value = localStorage.getItem('wftd_alias') || '';
            $('#profile-job').value = localStorage.getItem('wftd_job') || '';
            $('#profile-food').value = localStorage.getItem('wftd_food') || '';
            $('#profile-memory').value = localStorage.getItem('wftd_memory') || '';

            modal.classList.remove('hide');
            modal.setAttribute('aria-hidden', 'false');
        });
    }

    const closeModal = () => {
        modal.classList.add('hide');
        modal.setAttribute('aria-hidden', 'true');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const newAlias = $('#profile-alias').value.trim();
            if (newAlias) localStorage.setItem('wftd_alias', newAlias);

            localStorage.setItem('wftd_job', $('#profile-job').value.trim());
            localStorage.setItem('wftd_food', $('#profile-food').value.trim());
            localStorage.setItem('wftd_memory', $('#profile-memory').value.trim());

            saveBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveBtn.innerHTML = 'Save';
                closeModal();
            }, 800);
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target.id === 'profile-modal') closeModal();
    });
}

export function _openDetailModal(data, idx) {
    const modal = $('#schedule-modal');
    modal.dataset.editIndex = idx;
    const btn = $('#modal-edit-btn');
    btn.textContent = 'Edit';
    btn.classList.remove('val-green');
    const title = $('#modal-title'), desc = $('#modal-desc'), time = $('#modal-time'), duration = $('#modal-duration');
    [title, desc, time, duration].forEach(el => { el.contentEditable = false; el.classList.remove('editable-input'); });
    title.textContent = data.t;
    desc.textContent = data.d;
    time.textContent = data.time || '--:--';
    duration.textContent = data.dr || '--';

    const locContainer = $('#modal-location-container');
    const tipsContainer = $('#modal-smart-tips');

    if (data.loc) {
        $('#modal-location').textContent = data.loc;
        locContainer.classList.remove('hide');
        setTimeout(async () => {
            const mapEl = $('#modal-map');
            if (mapEl && window.L) {
                if (window.currentModalMap) { window.currentModalMap.remove(); window.currentModalMap = null; }
                mapEl.innerHTML = '';
                delete mapEl._leaflet_id;
                const map = window.L.map('modal-map', { zoomControl: true, scrollWheelZoom: false });
                window.currentModalMap = map;
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© <a href="https://osm.org/copyright">OpenStreetMap</a>' }).addTo(map);

                const bangkokLat = 13.7563, bangkokLon = 100.5018;
                const tryGeocode = async (query) => {
                    const lower = (query || '').toLowerCase();
                    if (lower.includes('home base') || lower === 'home' || lower === 'house' || lower === 'home, bangkok') {
                        const sLat = parseFloat($('#loc-hidden-lat')?.value || 13.7563);
                        const sLon = parseFloat($('#loc-hidden-lon')?.value || 100.5018);
                        const sName = $('#loc-hidden-name')?.value || 'Home Base';
                        return { lat: sLat, lon: sLon, display_name: `${sName}` };
                    }
                    try {
                        const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${bangkokLat}&lon=${bangkokLon}&limit=1&lang=en`);
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
                };

                let result = await tryGeocode(data.loc);
                if (!result && data.loc && data.loc.includes(',')) result = await tryGeocode(data.loc.split(',')[0].trim());

                if (result) {
                    map.setView([result.lat, result.lon], 16);
                    window.L.marker([result.lat, result.lon]).addTo(map).bindPopup(`<strong>${data.loc}</strong><br><small>${result.display_name}</small>`).openPopup();
                    $('#modal-location').textContent = result.display_name;
                    _renderTransportOptions(result.lat, result.lon, data.loc);
                } else {
                    map.setView([bangkokLat, bangkokLon], 13);
                    $('#modal-location').textContent = `Showing Bangkok — could not pin: ${data.loc}`;
                    $('#modal-transport-container').classList.add('hide');
                }
            }
        }, 50);

        if (data.tips && data.tips.length > 0) {
            tipsContainer.innerHTML = data.tips.map(t => `<span class="data-pill">${t.l}: ${t.v}</span>`).join('');
            tipsContainer.classList.remove('hide');
        } else {
            tipsContainer.innerHTML = '';
            tipsContainer.style.display = 'none';
        }
    } else {
        locContainer.classList.add('hide');
    }

    const costContainer = $('#modal-cost-container');
    const displayCost = data.cost_range || (typeof data.cost === 'number' && data.cost > 0 ? `${data.cost} THB` : null);
    if (displayCost) { $('#modal-cost').textContent = displayCost; costContainer.classList.remove('hide'); }
    else costContainer.classList.add('hide');
    modal.classList.remove('hide');
    modal.setAttribute('aria-hidden', 'false');
}

export function _closeDetailModal() {
    const modal = $('#schedule-modal');
    modal.classList.add('hide');
    modal.setAttribute('aria-hidden', 'true');
    if (window.currentModalMap) { try { window.currentModalMap.invalidateSize(); } catch (e) { } }
}

export function _updateWeatherUI(temp, desc, pm25, usAqi, rain) {
    const tempNode = $('#weather-temp'), descNode = $('#weather-desc'), aqiNode = $('#weather-aqi'), rainNode = $('#weather-rain');
    if (tempNode) tempNode.textContent = `${temp}°`;
    if (descNode) descNode.textContent = desc;
    if (aqiNode) {
        aqiNode.textContent = `${pm25} (AQI ${usAqi})`;
        aqiNode.className = 'metric-val';
        if (usAqi <= 50) aqiNode.classList.add('aqi-good');
        else if (usAqi <= 100) aqiNode.classList.add('aqi-moderate');
        else aqiNode.classList.add('aqi-unhealthy');
    }
    if (rainNode) rainNode.textContent = `${rain}%`;
}

let _locPickerMap = null;
let _locPickerMarker = null;

async function _reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        const addr = data.address || {};
        return addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.city || addr.county || 'Bangkok';
    } catch (_) { return 'Bangkok'; }
}

function _setLocResolved(name, lat, lon) {
    $('#loc-hidden-name').value = name;
    $('#loc-hidden-lat').value = lat;
    $('#loc-hidden-lon').value = lon;
    $('#loc-resolved-name').textContent = name;
    $('#loc-resolved-coords').textContent = `${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)}`;
    const resolvedEl = $('#loc-resolved');
    resolvedEl.classList.remove('hide');
    resolvedEl.style.display = 'flex';
    window.userGeoLocation = { lat: parseFloat(lat), lon: parseFloat(lon) };
}

export function _initLocPicker() {
    const gpsBtn = $('#loc-gps-btn'), pinBtn = $('#loc-pin-btn');
    if (!gpsBtn || !pinBtn) return;
    gpsBtn.addEventListener('click', async () => {
        gpsBtn.classList.add('selected'); pinBtn.classList.remove('selected');
        gpsBtn.querySelector('.loc-option-sub').textContent = 'Detecting...';
        $('#loc-map-container').classList.add('hide');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lon } = pos.coords;
                const name = await _reverseGeocode(lat, lon);
                _setLocResolved(name, lat, lon);
                gpsBtn.querySelector('.loc-option-sub').textContent = name;
                setTimeout(() => $('#loc-resolved').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            },
            () => { gpsBtn.querySelector('.loc-option-sub').textContent = 'Could not get location'; gpsBtn.classList.remove('selected'); },
            { timeout: 8000 }
        );
    });

    pinBtn.addEventListener('click', () => {
        pinBtn.classList.add('selected'); gpsBtn.classList.remove('selected');
        const mapContainer = $('#loc-map-container'); mapContainer.classList.remove('hide');
        setTimeout(() => mapContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
        if (!_locPickerMap && window.L) {
            const defaultLat = 13.7563, defaultLon = 100.5018;
            _locPickerMap = window.L.map('loc-picker-map', { zoomControl: true }).setView([defaultLat, defaultLon], 13);
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© <a href="https://osm.org/copyright">OSM</a>' }).addTo(_locPickerMap);
            _locPickerMarker = window.L.marker([defaultLat, defaultLon], { draggable: true }).addTo(_locPickerMap);
            _locPickerMarker.bindPopup('Drag me to your location').openPopup();
            const onMoved = async (e) => {
                const { lat, lng } = e.latlng || _locPickerMarker.getLatLng();
                const name = await _reverseGeocode(lat, lng);
                _setLocResolved(name, lat, lng);
                _locPickerMarker.bindPopup(`📍 ${name}`).openPopup();
                pinBtn.querySelector('.loc-option-sub').textContent = name;
                setTimeout(() => $('#loc-resolved').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            };
            _locPickerMarker.on('dragend', onMoved);
            _locPickerMap.on('click', (e) => { _locPickerMarker.setLatLng(e.latlng); onMoved(e); });
        }
        setTimeout(() => _locPickerMap && _locPickerMap.invalidateSize(), 200);
    });
}

export function _initFileHandling() {
    const input = $('#pdf-upload-input');
    const btn = $('#pdf-upload-btn');
    const status = $('#file-status');

    if (!input || !btn) return;

    btn.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            btn.classList.add('has-file');
            btn.querySelector('span').textContent = `Attached: ${file.name}`;
            status.textContent = 'Ready for AI OCR context.';
            status.style.display = 'block';
        } else {
            btn.classList.remove('has-file');
            btn.querySelector('span').textContent = 'Attach Schedule PDF (OCR ready)';
            status.style.display = 'none';
        }
    });
}
