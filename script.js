/**
 * WFTD // Engine Logic
 * Paradigm: Functional / Immutable-ish
 */

// Utils
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Boot sequence
document.addEventListener('DOMContentLoaded', _initEngine);

function _initEngine() {
    // 0. Initialize Auth Flow
    _initAuth();
    _initChat();

    // Inject Date Meta
    const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    $('#meta-time').textContent = formatter.format(new Date());

    // Bindings
    $('#engine-form').addEventListener('submit', _handleCompile);

    // Step Navigation Bindings
    $$('.next-btn').forEach(btn => btn.addEventListener('click', _nextStep));
    $$('.back-btn').forEach(btn => btn.addEventListener('click', _prevStep));
    $('.skip-btn').addEventListener('click', _handleBypass);

    // Regenerate Event
    const regenBtn = $('#regenerate-btn');
    if (regenBtn) {
        regenBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to scrap this schedule and start over?")) {
                localStorage.removeItem('wftd_today_date');
                localStorage.removeItem('wftd_today_schedule');
                location.reload();
            }
        });
    }

    // Suggestion Chips Binding
    $$('.chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const val = e.target.dataset.value;
            const stepCard = e.target.closest('.step-card');
            const stepNum = stepCard.dataset.step;

            if (stepNum === "1") {
                const input = $('textarea[name="directive"]');
                input.value = val;
                _handleGoalFeedback({ target: input });
                setTimeout(_nextStep, 150);
            } else if (stepNum === "2") {
                const input = $('input[name="entities"]');
                // Append if not empty to support multiple friends
                if (input.value && val) {
                    input.value = input.value + ', ' + val;
                } else {
                    input.value = val;
                }

                _handleEntitiesFeedback({ target: input });

                // Only advance if "skip" (empty) was clicked
                if (val === "") {
                    setTimeout(_nextStep, 150);
                }
            } else if (stepNum === "4") {
                const input = $('input[name="location"]');
                input.value = val;
                _handleLocationFeedback({ target: input });
                setTimeout(_nextStep, 150);
            }
        });
    });

    // Smart Enter logic (Allow Shift+Enter for Textarea)
    $('#engine-form').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (currentStep < 7) _nextStep();
            else _handleCompile(e);
        }
    });

    // Auto-expanding Textarea Support for Step 1
    const directiveInput = $('textarea[name="directive"]');
    if (directiveInput) {
        directiveInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // Dynamic Feedback Bindings
    $('textarea[name="directive"]').addEventListener('input', _handleGoalFeedback);
    $('input[name="entities"]').addEventListener('input', _handleEntitiesFeedback);
    const agendaContainer = $('#agenda-container');
    if (agendaContainer) agendaContainer.addEventListener('input', _handleAgendaFeedback);
    $('input[name="location"]').addEventListener('input', _handleLocationFeedback);
    $('input[name="capital"]').addEventListener('input', _handleBudgetFeedback);
    $('input[name="eod"]').addEventListener('input', _handleEodFeedback);

    // Modal Bindings
    _bindModalEvents();
}

// -----------------------------------------
// AUTHENTICATION FLOW (DEMO)
// -----------------------------------------
function _initAuth() {
    const alias = localStorage.getItem('wftd_alias');
    const pin = localStorage.getItem('wftd_pin');

    if (alias && pin) {
        // Returning User
        $('#auth-signup-layer').classList.add('hide');
        $('#auth-login-layer').classList.remove('hide');
        $('#auth-welcome-back').textContent = 'Welcome back, ' + alias;
    } else {
        // New User
        $('#auth-signup-layer').classList.remove('hide');
        $('#auth-login-layer').classList.add('hide');
    }

    // Events
    $('#btn-auth-signup').addEventListener('click', _handleSignup);
    $('#btn-auth-login').addEventListener('click', _handleLogin);
    $('#btn-auth-reset').addEventListener('click', () => {
        localStorage.removeItem('wftd_alias');
        localStorage.removeItem('wftd_pin');
        localStorage.removeItem('wftd_food');
        localStorage.removeItem('wftd_zone');
        location.reload();
    });
}

function _handleSignup() {
    const alias = $('#auth-alias-input').value.trim();
    const pin = $('#auth-pin-setup').value.trim();
    const errorNode = $('#auth-error');

    if (!alias) {
        errorNode.textContent = "Alias required.";
        return;
    }
    if (pin.length !== 4 || isNaN(pin)) {
        errorNode.textContent = "PIN must be 4 numeric digits.";
        return;
    }

    const food = $('#auth-food-input').value.trim();
    const zone = $('#auth-zone-input').value.trim();

    localStorage.setItem('wftd_alias', alias);
    localStorage.setItem('wftd_pin', pin);
    if (food) localStorage.setItem('wftd_food', food);
    if (zone) localStorage.setItem('wftd_zone', zone);

    _unlockWorkspace(alias);
}

function _handleLogin() {
    const inputPin = $('#auth-pin-login').value.trim();
    const storedPin = localStorage.getItem('wftd_pin');
    const alias = localStorage.getItem('wftd_alias');
    const errorNode = $('#auth-error');

    if (inputPin === storedPin) {
        _unlockWorkspace(alias);
    } else {
        errorNode.textContent = "INCORRECT PIN.";
        $('#auth-pin-login').value = '';
    }
}

function _unlockWorkspace(alias) {
    $('#auth-error').textContent = "";
    const authLayer = $('#auth-view');
    authLayer.classList.add('hide');

    // Setup skip check
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('wftd_today_date');
    if (savedDate === today) {
        try {
            const data = JSON.parse(localStorage.getItem('wftd_today_schedule'));
            if (data && data.itinerary) {
                _mountSurface(data.state, data.itinerary, data.insights);
                return; // Bypass form setup completely
            }
        } catch (e) { console.error('Error loading saved schedule:', e); }
    }

    // If not bypassed, proceed with showing the landing view after a delay
    setTimeout(() => {
        authLayer.style.display = 'none'; // Hide completely after transition
        const landing = $('#landing-view');
        landing.classList.remove('hide');
        landing.setAttribute('aria-hidden', 'false');

        // Personalize Step 1
        const step1Label = $('#step-1-label');
        if (step1Label) {
            step1Label.textContent = `What's your main goal for today, ${alias}?`;
        }

        // Focus first input automatically
        setTimeout(() => {
            const firstInput = $('textarea[name="directive"]');
            if (firstInput) firstInput.focus();
        }, 100);
    }, 600); // Wait for transition
}

// -----------------------------------------
// ENGINE STATE & NAVIGATION
// -----------------------------------------

// State
let currentStep = 1;

// Step Navigation
function _nextStep() {
    const currentCard = $(`.step-card[data-step="${currentStep}"]`);
    const input = currentCard.querySelector('input, textarea');

    // Basic validation
    if (input && input.required && !input.value.trim()) {
        input.focus();
        return;
    }

    if (currentStep < 7) {
        currentCard.classList.remove('active');
        currentCard.classList.add('hidden-left');

        let nextStepNum = currentStep + 1;

        // Conditional Step 3 (Agenda)
        if (currentStep === 2) {
            const entitiesVal = $('input[name="entities"]').value.trim();
            if (!entitiesVal) {
                nextStepNum = 4; // Skip Agenda if no people
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

function _prevStep() {
    if (currentStep > 1) {
        const currentCard = $(`.step-card[data-step="${currentStep}"]`);
        currentCard.classList.remove('active');
        currentCard.classList.add('hidden-right');

        let prevStepNum = currentStep - 1;

        // Conditional Step 3 Backwards
        if (currentStep === 4) {
            const entitiesVal = $('input[name="entities"]').value.trim();
            if (!entitiesVal) {
                prevStepNum = 2; // Skip Agenda backward if no people
            }
        }

        currentStep = prevStepNum;
        const prevCard = $(`.step-card[data-step="${currentStep}"]`);
        prevCard.classList.remove('hidden-left');
        prevCard.classList.add('active');
    }
}

// Dynamic Feedback Handlers
function _showFeedback(nodeId, text) {
    const node = $(`#${nodeId}`);
    node.textContent = text;
    if (text) {
        node.classList.add('visible');
    } else {
        node.classList.remove('visible');
    }
}

function _handleGoalFeedback(e) {
    const val = e.target.value.trim();
    // Support counting by newlines OR commas
    const lines = val.split(/[,\n]+/).filter(l => l.trim().length > 0).length;

    let msg = '';
    if (lines === 1) msg = 'Laser focus. Love to see it.';
    else if (lines === 2) msg = 'Double threat. Solid play. Let\'s execute.';
    else if (lines >= 3) msg = 'Absolute beast mode today. Let\'s crush it.';

    _showFeedback('fb-directive', msg);
}

function _handleEntitiesFeedback(e) {
    const val = e.target.value.trim();
    const count = val ? val.split(',').length : 0;

    let msg = '';
    if (val.length > 0 && count === 1) msg = 'One-on-one power sync.';
    else if (count > 1) msg = 'Networking god. We\'ll balance the energy.';

    _showFeedback('fb-entities', msg);
}

function _handleAgendaFeedback(e) {
    const val = e.target.value.trim();
    let msg = '';
    if (val.length > 0 && val.length < 15) msg = 'Short and ruthless agenda. Perfect.';
    else if (val.length >= 15) msg = 'Detailed alignment. Total clarity.';
    _showFeedback('fb-agenda', msg);
}

function _handleLocationFeedback(e) {
    const val = e.target.value.trim().toLowerCase();
    let msg = '';
    if (val.includes('home')) msg = 'Zero commute. Maximum focus.';
    else if (val.includes('cafe')) msg = 'Bustling energy. Grab a brew.';
    else if (val.includes('work')) msg = 'Professional vibe. Let\'s build.';
    else if (val.length > 3) msg = 'Solid HQ for the day.';
    _showFeedback('fb-location', msg);
}

function _handleBudgetFeedback(e) {
    const val = parseInt(e.target.value, 10);

    let msg = '';
    if (val === 0) msg = 'Zero spend? Respect the grind.';
    else if (val > 0 && val <= 20) msg = 'Lean operations. Smart.';
    else if (val > 20) msg = 'Big baller! Treat yourself today.';

    _showFeedback('fb-capital', msg);
}

function _handleEodFeedback(e) {
    const val = e.target.value;
    let msg = '';
    if (val) {
        msg = `Quitting at ${val}. Locked in till then.`;
    }
    _showFeedback('fb-eod', msg);
}

// Data Models
const CORE_REGIMEN = [
    { time: '0700', t: 'Morning Routine', d: 'Coffee, hydration, warm-up.', cat: 'leisure', dr: '1h', loc: 'Home Base', cost: 0 },
    { time: '0800', t: 'Deep Work', d: 'Execution on highest priority goal.', cat: 'work', dr: '3h' },
    { time: '1100', t: 'Break', d: 'Step away and stretch.', cat: 'leisure', dr: '1h' },
    { time: '1200', t: 'Emails & Admin', d: 'Process messages and organize.', cat: 'work', dr: '2h' },
    { time: '1400', t: 'Secondary Tasks', d: 'Exploratory tasks and side projects.', cat: 'work', dr: '2h', loc: 'Local Library / Desk' },
    { time: '1600', t: 'Wind Down', d: 'Log off and rest.', cat: 'leisure', dr: 'EOD' }
];

// Mutators / Handlers
async function _handleCompile(e) {
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
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            console.warn('Gemini API key missing. Falling back to local offline generation.');
            itinerary = _synthesizeItinerary(payload);
        } else {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const savedZone = localStorage.getItem('wftd_zone') || 'Bangkok';

            // Pick up the chosen starting location from Step 4
            const startLocName = $('#loc-hidden-name')?.value || savedZone;
            const startLat = $('#loc-hidden-lat')?.value;
            const startLon = $('#loc-hidden-lon')?.value;
            const startLocClause = (startLat && startLon)
                ? `\nUser's STARTING LOCATION for today: "${startLocName}" (lat: ${startLat}, lon: ${startLon}). All suggested places should be reasonably reachable from this point.`
                : `\nUser's base area: ${savedZone}, Bangkok.`;

            const notesClause = payload.notes ? `\n\nExtra user instructions: ${payload.notes}` : '';
            const prompt = `You are a creative, insightful personal scheduler for a user in ${savedZone}, Bangkok, Thailand. Return ONLY a raw JSON array of schedule objects — no markdown, no extra text.

Format: [{"time":"0900","t":"Task Name","d":"Vivid one-sentence description.","cat":"work","dr":"2h","loc":"Real Place Name"}]

YOUR JOB — FILLING THE DAY:
The user has a primary goal but a full day to fill from morning until their EOD time. Do NOT repeat the main goal for every block. Instead:
1. Give the main goal its dedicated focus block(s).
2. Infer what kind of person pursues this goal and fill the REST of the day with complementary, enriching activities they would genuinely enjoy.
   - e.g. if goal = "write a novel" → suggest: a quiet cafe for reading, a local temple for reflection, a photography walk, a bookshop visit, journaling at a park, etc.
   - e.g. if goal = "gym session" → suggest: a healthy brunch, a stretching/yoga class, a pool, a smoothie spot, etc.
3. Always include: morning routine, meals (breakfast, lunch, dinner at real Bangkok restaurants), wind-down.
4. The schedule MUST cover the full day from ~0700 to the user's EOD time with NO large gaps.
5. Aim for 8–12 blocks total. Make the day feel RICH and COMPLETE.
${startLocClause}

LOCATION RULES:
- Use REAL, SPECIFIC, SEARCHABLE place names on OpenStreetMap.
- Good: "Wat Suthat Thepwararam", "Bookmoby Ekkamai", "The Commons Thonglor", "Paper Butter & The Burger Ari"
- Bad: "Pizza shop", "Nearby temple", "Local park", "Home Base"
- Prioritise places near the user's starting location, keeping travel practical.
- For home blocks: "Home, ${startLocName}, Bangkok"
- "cat" = "work" or "leisure". "time" = 4-digit 24h string like "0900".

User data: ${JSON.stringify(payload)}${notesClause}`;

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
                console.error('Gemini API error body:', errBody);
                throw new Error(`Gemini API error: ${response.status} — ${errBody?.error?.message || 'unknown'}`);
            }
            const raw = await response.json();
            const content = raw.candidates[0].content.parts[0].text.trim();

            // Strip markdown wrappers if model adds them
            let cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

            // If JSON is truncated, try to recover by closing the array at the last complete object
            try {
                itinerary = JSON.parse(cleanJson);
            } catch {
                const lastBrace = cleanJson.lastIndexOf('},');
                if (lastBrace !== -1) {
                    cleanJson = cleanJson.substring(0, lastBrace + 1) + ']';
                    itinerary = JSON.parse(cleanJson);
                } else {
                    throw new Error('Could not recover truncated JSON from Gemini response');
                }
            }
        }
    } catch (err) {
        console.error('Gemini AI Error:', err);
        alert(`AI generation failed: ${err.message}\n\nFalling back to local generator.`);
        itinerary = _synthesizeItinerary(payload);
    }

    const insights = _generateTelemetryLogs(payload);

    // Persist today's schedule
    const today = new Date().toDateString();
    localStorage.setItem('wftd_today_date', today);
    localStorage.setItem('wftd_today_schedule', JSON.stringify({ state: payload, itinerary, insights }));

    if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.style.opacity = '1';
        submitBtn.disabled = false;
    }

    _mountSurface(payload, itinerary, insights);
}

function _handleBypass() {
    const payload = { directive: 'Standard Routine', entities: '', capital: 0, margin: 2 };
    const insights = ['Using default schedule.', 'No custom budget or limits applied.'];
    _mountSurface(payload, CORE_REGIMEN, insights);
}

// Content Injection
function _buildAgendaInputs(entitiesStr) {
    const container = $('#agenda-container');
    if (!container) return;

    const entities = entitiesStr.split(',').map(s => s.trim()).filter(s => s);
    if (entities.length === 0) return;

    if (entities.length === 1) {
        container.innerHTML = `
            <input type="text" class="input-majestic" name="agenda_${entities[0]}"
                placeholder="e.g., Performance Review, Pitch..." autocomplete="off">
        `;
    } else {
        container.innerHTML = entities.map((name, i) => `
            <div style="margin-bottom: ${i < entities.length - 1 ? '24px' : '0'}; text-align: left;">
                <label class="type-caption" style="display:block; margin-bottom: 8px; color: var(--clr-brand); font-weight: bold; font-size: 14px;">Agenda for ${name}</label>
                <input type="text" class="input-majestic agenda-input" name="agenda_${name}" placeholder="What are you discussing?" autocomplete="off" style="font-size: clamp(20px, 3vw, 32px);">
            </div>
        `).join('');
    }
}

// Logic / Pure-ish Functions
const _synthesizeItinerary = (payload) => {
    const { directive, entities, location, capital, eod } = payload;
    let raw = [];

    // Smart Location Parsing
    let baseLoc = 'Local Library / Desk';
    let meetLoc = 'Coffee Shop / Office';
    let locTips = [];

    const savedZone = localStorage.getItem('wftd_zone') || 'Local';
    const savedFood = localStorage.getItem('wftd_food') || '';

    if (location) {
        const l = location.toLowerCase();
        if (l.includes('cafe')) {
            baseLoc = location;
            meetLoc = location;
            locTips = [
                { l: 'Transport', v: `BTS/Walk from ${savedZone}` },
                { l: 'Wifi', v: 'Variable (Check Reviews)' },
                { l: 'Plugs', v: 'Arrive early' }
            ];
        } else if (l.includes('co-working') || l.includes('coworking') || l.includes('work space')) {
            baseLoc = location;
            meetLoc = location;
            locTips = [
                { l: 'Transport', v: `Commute from ${savedZone}` },
                { l: 'Wifi', v: 'High Speed' },
                { l: 'Plugs', v: 'Abundant' }
            ];
        } else if (l.includes('home')) {
            baseLoc = location;
            meetLoc = 'Virtual / Zoom';
            locTips = [
                { l: 'Wifi', v: 'Stable' },
                { l: 'Vibe', v: 'Comfortable' }
            ];
        } else {
            baseLoc = location;
            meetLoc = location;
        }
    }

    // Parse numeric
    const cap = parseInt(capital, 10) || 0;

    raw.push({ time: '0830', t: 'Start Goal', d: `Focusing on: "${directive}"`, cat: 'work', dr: '30m', loc: baseLoc, tips: locTips });

    if (entities) {
        const entityList = entities.split(',').map(s => s.trim()).filter(s => s);
        let currentMeetingTime = 1000;

        entityList.forEach((entity) => {
            const specificAgenda = payload[`agenda_${entity}`];
            const generalAgenda = payload.agenda_general;
            const agenda = specificAgenda !== undefined ? specificAgenda : generalAgenda;

            const meetingDesc = agenda ? `Agenda: ${agenda}` : 'Alignment sync.';
            const meetCost = cap > 20 ? 15 : (cap > 0 ? 5 : 0);

            let tStr = currentMeetingTime.toString();
            if (tStr.length === 3) tStr = '0' + tStr;

            raw.push({ time: tStr, t: `Meeting with ${entity}`, d: meetingDesc, cat: 'meet', dr: '1h', loc: meetLoc, cost: meetCost, tips: locTips });
            currentMeetingTime += 100; // Increment by 1 hr
        });

        // Post-meeting gap
        let postMeetStr = currentMeetingTime.toString();
        if (postMeetStr.length === 3) postMeetStr = '0' + postMeetStr;
        raw.push({ time: postMeetStr, t: 'Post-Meeting Work', d: 'Action items processing.', cat: 'work', dr: '1.5h', loc: baseLoc });
    } else {
        raw.push({ time: '0900', t: 'Focus Block', d: `Uninterrupted time for: ${directive}`, cat: 'work', dr: '3.5h', loc: baseLoc, tips: locTips });
    }

    let lunchData = 'Lunch break and reset.';
    if (cap > 0 && cap < 20) {
        lunchData = 'Consider packing lunch to save budget.';
    } else if (savedFood) {
        lunchData = `Checking ${savedZone} for top ${savedFood} spots.`;
    }

    const lunchCost = cap > 20 ? 25 : (cap > 0 ? 10 : 0);

    raw.push({ time: '1300', t: 'Lunch Break', d: lunchData, cat: 'leisure', dr: '1h', loc: `${savedZone} Eatery`, cost: lunchCost });
    raw.push({ time: '1400', t: 'Secondary Tasks', d: 'Clearing intermediate tasks.', cat: 'work', dr: '2.5h', loc: baseLoc, tips: locTips });

    const endTime = eod || '17:00';
    raw.push({ time: endTime.replace(':', ''), t: 'Wind Down', d: 'End of work day. Hard stop.', cat: 'leisure', dr: 'EOD' });

    return raw;
};

const _generateTelemetryLogs = ({ capital, eod, entities, directive }) => {
    const logs = [];
    const cap = parseInt(capital, 10);

    if (cap > 0 && cap < 30) logs.push('Low budget today. Spend carefully.');
    if (directive.length > 5) logs.push('Absolute beast mode goals today.');
    if (entities) logs.push(`Networking sync activated: ${entities}`);
    if (eod) logs.push(`Hard stop requested precisely at ${eod}.`);
    if (logs.length === 0) logs.push('Schedule looks legendary. Have a good day!');

    return logs;
};

// DOM Renderer
function _mountSurface(state, itinerary, insights) {
    // 1. Hide Landing View
    const landing = $('#landing-view');
    landing.classList.add('hide');
    landing.setAttribute('aria-hidden', 'true');

    // 2. Hydrate Telemetry
    $('#state-directive').textContent = state.directive;
    $('#stat-capital').textContent = state.capital ? `$${state.capital}` : 'None';

    // Quick UI hack to reuse the old margin label for EOD:
    const marginNode = $('#stat-margin');
    marginNode.textContent = state.eod || '17:00';
    marginNode.previousElementSibling.textContent = 'Hard Stop';

    $('#stat-entities').textContent = state.entities || 'Null';

    // 3. Hydrate Logs
    const logContainer = $('#system-logs');
    logContainer.innerHTML = insights.map(i => `<li>${i}</li>`).join('');

    // 4. Render Timeline with Staggered Nodes
    const track = $('#timeline-root');
    track.innerHTML = itinerary.map((node, i) => `
        <article class="track-node" data-index="${i}" style="animation-delay: ${i * 0.12}s; cursor: pointer;" data-info="${JSON.stringify(node).replace(/"/g, '&quot;')}">
            <time class="node-meta">${node.time}</time>
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

    // 5. Unveil Surface
    setTimeout(() => {
        const surface = $('#app-surface');
        surface.classList.remove('hide');
        surface.removeAttribute('aria-hidden');

        _startLiveTracking();
        _showChat();
    }, 300); // Wait for overlay to dissolve
}

let trackingInterval;
function _startLiveTracking() {
    if (trackingInterval) clearInterval(trackingInterval);

    const checkTimeStates = () => {
        const now = new Date();
        const curHours = now.getHours();
        const curMins = now.getMinutes();
        const currentTotalMinutes = (curHours * 60) + curMins;

        const nodes = document.querySelectorAll('.track-node');
        let activeFound = false;

        nodes.forEach((node, idx) => {
            const data = JSON.parse(node.dataset.info || '{}');
            if (!data.time) return;

            const isEod = data.dr === 'EOD';

            // Parse HHMM directly
            const timeStr = data.time.toString();
            const nodeHours = parseInt(timeStr.substring(0, 2), 10);
            const nodeMins = parseInt(timeStr.substring(2, 4), 10);
            const nodeTotalMinutes = (nodeHours * 60) + nodeMins;

            // Simple heuristic to determine if node is active
            // Assume the next node's time is the end time for this node.
            let nextNodeMinutes = 24 * 60; // End of day default
            if (idx + 1 < nodes.length) {
                const nextData = JSON.parse(nodes[idx + 1].dataset.info || '{}');
                if (nextData.time) {
                    const nextTimeStr = nextData.time.toString();
                    const nHours = parseInt(nextTimeStr.substring(0, 2), 10);
                    const nMins = parseInt(nextTimeStr.substring(2, 4), 10);
                    nextNodeMinutes = (nHours * 60) + nMins;
                }
            }

            node.classList.remove('status-past', 'status-active');

            if (currentTotalMinutes >= nodeTotalMinutes && currentTotalMinutes < nextNodeMinutes) {
                node.classList.add('status-active');
            } else if (currentTotalMinutes >= nextNodeMinutes) {
                node.classList.add('status-past');
            }
        });
    };

    checkTimeStates(); // Initial call
    trackingInterval = setInterval(checkTimeStates, 60000); // Check every minute
}

// Modal Logic
function _bindModalEvents() {
    $('#timeline-root').addEventListener('click', (e) => {
        const nodeEl = e.target.closest('.track-node');
        if (!nodeEl) return;

        try {
            const data = JSON.parse(nodeEl.dataset.info || '{}');
            const idx = nodeEl.dataset.index;
            _openDetailModal(data, idx);
        } catch (err) {
            console.error('Failed to parse node data', err);
        }
    });

    $('#modal-close-btn').addEventListener('click', _closeDetailModal);
    $('#schedule-modal').addEventListener('click', (e) => {
        if (e.target.id === 'schedule-modal') _closeDetailModal();
    });

    $('#modal-edit-btn').addEventListener('click', () => {
        const btn = $('#modal-edit-btn');
        const isEditing = btn.textContent === 'Save';

        const title = $('#modal-title');
        const desc = $('#modal-desc');
        const time = $('#modal-time');
        const duration = $('#modal-duration');

        if (!isEditing) {
            // Enter Edit Mode
            btn.textContent = 'Save';
            btn.classList.add('val-green');
            [title, desc, time, duration].forEach(el => {
                el.contentEditable = true;
                el.classList.add('editable-input');
            });
            title.focus();
        } else {
            // Save Mode
            btn.textContent = 'Edit';
            btn.classList.remove('val-green');
            [title, desc, time, duration].forEach(el => {
                el.contentEditable = false;
                el.classList.remove('editable-input');
            });

            // Persist to storage
            try {
                const idx = $('#schedule-modal').dataset.editIndex;
                const saved = JSON.parse(localStorage.getItem('wftd_today_schedule'));
                if (saved && saved.itinerary && saved.itinerary[idx]) {
                    saved.itinerary[idx].t = title.textContent.trim();
                    saved.itinerary[idx].d = desc.textContent.trim();
                    saved.itinerary[idx].time = time.textContent.trim();
                    saved.itinerary[idx].dr = duration.textContent.trim();

                    localStorage.setItem('wftd_today_schedule', JSON.stringify(saved));

                    // Re-render the timeline in the background seamlessly
                    _mountSurface(saved.state, saved.itinerary, saved.insights);
                }
            } catch (err) { console.error('Error saving edits', err); }

            _closeDetailModal();
        }
    });
}

function _openDetailModal(data, idx) {
    const modal = $('#schedule-modal');
    modal.dataset.editIndex = idx;

    // Reset Edit State if left open
    const btn = $('#modal-edit-btn');
    btn.textContent = 'Edit';
    btn.classList.remove('val-green');

    const title = $('#modal-title');
    const desc = $('#modal-desc');
    const time = $('#modal-time');
    const duration = $('#modal-duration');

    [title, desc, time, duration].forEach(el => {
        el.contentEditable = false;
        el.classList.remove('editable-input');
    });

    title.textContent = data.t;
    desc.textContent = data.d;
    time.textContent = data.time || '--:--';
    duration.textContent = data.dr || '--';

    const locContainer = $('#modal-location-container');
    const tipsContainer = $('#modal-smart-tips');

    if (data.loc) {
        $('#modal-location').textContent = data.loc;
        locContainer.classList.remove('hide');

        // Render Leaflet map via free Nominatim geocoding (OpenStreetMap)
        setTimeout(async () => {
            const mapEl = $('#modal-map');
            if (mapEl && window.L) {
                // Fully destroy previous map instance to prevent 'already initialized' errors
                if (window.currentModalMap) {
                    window.currentModalMap.remove();
                    window.currentModalMap = null;
                }
                // Reset the container so Leaflet can re-initialize it
                mapEl.innerHTML = '';
                delete mapEl._leaflet_id;

                const map = window.L.map('modal-map', { zoomControl: true, scrollWheelZoom: false });
                window.currentModalMap = map;
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© <a href="https://osm.org/copyright">OpenStreetMap</a>'
                }).addTo(map);

                // Geocoding strategy: Photon (POI-rich) → Nominatim fallback
                const bangkokLat = 13.7563, bangkokLon = 100.5018;

                const tryGeocode = async (query) => {
                    // Try Photon first (better for restaurant/POI names)
                    try {
                        const photonRes = await fetch(
                            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${bangkokLat}&lon=${bangkokLon}&limit=1&lang=en`
                        );
                        const photonData = await photonRes.json();
                        if (photonData.features && photonData.features[0]) {
                            const [lon, lat] = photonData.features[0].geometry.coordinates;
                            const props = photonData.features[0].properties;
                            const name = props.name || props.street || query;
                            const city = props.city || props.state || 'Bangkok';
                            return { lat, lon, display_name: `${name}, ${city}` };
                        }
                    } catch (_) { }

                    // Fallback to Nominatim
                    try {
                        const nomRes = await fetch(
                            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Bangkok, Thailand')}&format=json&limit=1&countrycodes=th`,
                            { headers: { 'Accept-Language': 'en' } }
                        );
                        const nomData = await nomRes.json();
                        if (nomData && nomData[0]) {
                            return { lat: nomData[0].lat, lon: nomData[0].lon, display_name: nomData[0].display_name };
                        }
                    } catch (_) { }

                    return null;
                };

                // Try full name, then just the primary name (before first comma)
                let result = await tryGeocode(data.loc);
                if (!result && data.loc.includes(',')) {
                    result = await tryGeocode(data.loc.split(',')[0].trim());
                }

                if (result) {
                    map.setView([result.lat, result.lon], 16);
                    window.L.marker([result.lat, result.lon])
                        .addTo(map)
                        .bindPopup(`<strong>${data.loc}</strong><br><small>${result.display_name}</small>`)
                        .openPopup();
                    $('#modal-location').textContent = result.display_name;

                    // Show transport options once we have destination coords
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
    if (typeof data.cost === 'number' && data.cost > 0) {
        $('#modal-cost').textContent = `$${data.cost}`;
        costContainer.classList.remove('hide');
    } else {
        costContainer.classList.add('hide');
    }

    modal.classList.remove('hide');
    modal.setAttribute('aria-hidden', 'false');
}

function _closeDetailModal() {
    const modal = $('#schedule-modal');
    modal.classList.add('hide');
    modal.setAttribute('aria-hidden', 'true');

    // Invalidate Leaflet size on close/reopen
    if (window.currentModalMap) {
        try { window.currentModalMap.invalidateSize(); } catch (e) { }
    }
}

// ─── AI Chat Engine ─────────────────────────────
const chatHistory = [];

function _appendChatMsg(text, role) {
    const container = $('#chat-messages');
    const div = document.createElement('div');
    div.className = `chat-msg msg-${role}`;
    div.innerHTML = `<span class="msg-bubble">${text}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

async function _sendChatMessage() {
    const input = $('#chat-input');
    const userText = input.value.trim();
    if (!userText) return;
    input.value = '';

    _appendChatMsg(userText, 'user');
    const typingNode = _appendChatMsg('Thinking...', 'ai msg-typing');

    // Build current schedule context
    let scheduleContext = '';
    try {
        const saved = JSON.parse(localStorage.getItem('wftd_today_schedule'));
        if (saved && saved.itinerary) {
            scheduleContext = JSON.stringify(saved.itinerary);
        }
    } catch (e) { }

    chatHistory.push({ role: 'user', text: userText });

    const systemPrompt = `You are SCHED AI, a sharp schedule assistant embedded in a productivity app called WFTD. The user's full schedule for today is: ${scheduleContext}. 

You can either:
1. Answer questions about the schedule in plain text.
2. If the user asks to CHANGE the schedule (add, remove, move tasks), return a JSON object ONLY: {"type":"schedule_update","message":"Brief confirmation.","schedule":[...full updated array...]}
   The schedule array format: [{"time":"0900","t":"Task Name","d":"Description.","cat":"work","dr":"2h","loc":"Place"}]
3. For all other replies, just reply in plain text — no JSON.`;

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') throw new Error('No API key');

        const messages = chatHistory.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: messages,
                    generationConfig: { temperature: 0.6, maxOutputTokens: 4096 }
                })
            }
        );

        const raw = await response.json();
        const replyText = raw.candidates[0].content.parts[0].text.trim();
        chatHistory.push({ role: 'model', text: replyText });

        typingNode.remove();

        // Try to detect schedule update JSON
        try {
            const cleaned = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed.type === 'schedule_update' && parsed.schedule) {
                _appendChatMsg(parsed.message || 'Schedule updated!', 'ai');
                // Update localStorage and re-render
                const saved = JSON.parse(localStorage.getItem('wftd_today_schedule') || '{}');
                saved.itinerary = parsed.schedule;
                localStorage.setItem('wftd_today_schedule', JSON.stringify(saved));
                _mountSurface(saved.state || {}, parsed.schedule, saved.insights || []);
                return;
            }
        } catch (_) { /* Not JSON — plain text reply */ }

        _appendChatMsg(replyText, 'ai');
    } catch (err) {
        typingNode.remove();
        _appendChatMsg('Error reaching AI. Check your API key.', 'ai');
        console.error('Chat error:', err);
    }
}

function _initChat() {
    const panel = $('#chat-panel');
    const toggleBtn = $('#chat-toggle-btn');
    const header = $('.chat-header');
    const floatBtn = $('#chat-float-btn');
    const sendBtn = $('#chat-send-btn');
    const input = $('#chat-input');

    // Start hidden — shows only once schedule is mounted
    panel.classList.add('hide');

    // Toggle collapse/expand
    header.addEventListener('click', () => panel.classList.toggle('collapsed'));
    toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('collapsed'); });

    // Send on button click or Enter
    sendBtn.addEventListener('click', _sendChatMessage);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') _sendChatMessage(); });

    // Float btn shows chat again
    if (floatBtn) floatBtn.addEventListener('click', () => { panel.classList.remove('hide'); panel.classList.remove('collapsed'); floatBtn.classList.add('hide'); });
}

function _showChat() {
    const panel = $('#chat-panel');
    if (panel) { panel.classList.remove('hide'); panel.classList.remove('collapsed'); }
}

// ─── Transport Options Engine ────────────────────
// Cache user location globally (ask once per session)
window.userGeoLocation = null;

function _haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _formatMinutes(mins) {
    if (mins < 60) return `~${Math.round(mins)} min`;
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

function _buildTransportCards(destLat, destLon, destName) {
    const userLoc = window.userGeoLocation;
    if (!userLoc) return;

    // Straight-line distance × Bangkok road factor (1.4 for winding roads)
    const straightKm = _haversineKm(userLoc.lat, userLoc.lon, destLat, destLon);
    const roadKm = straightKm * 1.4;

    // Bangkok-tuned average speeds
    const modes = [
        { icon: '🚶', label: 'Walk', kmh: 4.5, gmMode: 'walking', extra: 0 },
        { icon: '🚇', label: 'BTS/MRT', kmh: 28, gmMode: 'transit', extra: 10 }, // +10 min walk to station
        { icon: '🚗', label: 'Grab', kmh: 18, gmMode: 'driving', extra: 5 }, // +5 min wait
        { icon: '🛵', label: 'Motorbike', kmh: 22, gmMode: 'driving', extra: 0 },
    ];

    const gmBase = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destName + ', Bangkok, Thailand')}&origin=${userLoc.lat},${userLoc.lon}`;
    const container = $('#modal-transport-options');
    container.innerHTML = modes.map(m => {
        const mins = (roadKm / m.kmh) * 60 + m.extra;
        const url = `${gmBase}&travelmode=${m.gmMode}`;
        return `<a class="transport-card" href="${url}" target="_blank" rel="noopener">
            <span class="transport-icon">${m.icon}</span>
            <span class="transport-mode">${m.label}</span>
            <span class="transport-time">${_formatMinutes(mins)}</span>
        </a>`;
    }).join('');

    // Google Maps directions link
    const link = $('#modal-directions-link');
    link.href = gmBase;
    link.classList.remove('hide');

    // From label
    $('#transport-from-label').textContent = `From: Your location (${straightKm.toFixed(1)} km away)`;
}

function _renderTransportOptions(destLat, destLon, destName) {
    const container = $('#modal-transport-container');
    container.classList.remove('hide');
    $('#modal-directions-link').classList.add('hide');
    $('#modal-transport-options').innerHTML = '<span style="font-size:var(--tx-sm);color:#888;">Detecting your location...</span>';

    const locateBtn = $('#transport-locate-btn');
    if (locateBtn) {
        // Re-bind to allow re-requesting location
        locateBtn.onclick = () => _requestGeolocation(() => _buildTransportCards(destLat, destLon, destName));
    }

    if (window.userGeoLocation) {
        _buildTransportCards(destLat, destLon, destName);
    } else {
        _requestGeolocation(() => _buildTransportCards(destLat, destLon, destName));
    }
}

function _requestGeolocation(onSuccess) {
    if (!navigator.geolocation) {
        $('#modal-transport-options').innerHTML = '<span style="font-size:var(--tx-sm);color:#888;">Geolocation not supported.</span>';
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            window.userGeoLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            onSuccess();
        },
        () => {
            // Permission denied or error — use Bangkok centre as fallback
            window.userGeoLocation = { lat: 13.7563, lon: 100.5018 };
            $('#transport-from-label').textContent = 'From: Bangkok centre (location denied)';
            onSuccess();
        },
        { timeout: 8000, maximumAge: 300000 }
    );
}

// ─── Step 4: Location Picker ─────────────────────
let _locPickerMap = null;
let _locPickerMarker = null;

async function _reverseGeocode(lat, lon) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        const addr = data.address || {};
        // Build a short, meaningful neighbourhood name
        return addr.suburb || addr.neighbourhood || addr.quarter ||
            addr.city_district || addr.city || addr.county || 'Bangkok';
    } catch (_) { return 'Bangkok'; }
}

function _setLocResolved(name, lat, lon) {
    $('#loc-hidden-name').value = name;
    $('#loc-hidden-lat').value = lat;
    $('#loc-hidden-lon').value = lon;

    // Show the confirmed location panel
    $('#loc-resolved-name').textContent = name;
    $('#loc-resolved-coords').textContent = `${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)}`;
    const resolvedEl = $('#loc-resolved');
    resolvedEl.classList.remove('hide');
    resolvedEl.style.display = 'flex';

    // Also update the global geolocation cache so transport cards work
    window.userGeoLocation = { lat: parseFloat(lat), lon: parseFloat(lon) };
}

function _initLocPicker() {
    const gpsBtn = $('#loc-gps-btn');
    const pinBtn = $('#loc-pin-btn');

    if (!gpsBtn || !pinBtn) return;

    // Option 1: GPS
    gpsBtn.addEventListener('click', async () => {
        gpsBtn.classList.add('selected');
        pinBtn.classList.remove('selected');
        gpsBtn.querySelector('.loc-option-sub').textContent = 'Detecting...';

        // Hide map if open
        $('#loc-map-container').classList.add('hide');

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lon } = pos.coords;
                const name = await _reverseGeocode(lat, lon);
                _setLocResolved(name, lat, lon);
                gpsBtn.querySelector('.loc-option-sub').textContent = name;
            },
            () => {
                gpsBtn.querySelector('.loc-option-sub').textContent = 'Could not get location';
                gpsBtn.classList.remove('selected');
            },
            { timeout: 8000 }
        );
    });

    // Option 2: Pin on map
    pinBtn.addEventListener('click', () => {
        pinBtn.classList.add('selected');
        gpsBtn.classList.remove('selected');

        const mapContainer = $('#loc-map-container');
        mapContainer.classList.remove('hide');

        // Init Leaflet picker map (only once)
        if (!_locPickerMap && window.L) {
            const defaultLat = 13.7563, defaultLon = 100.5018;
            _locPickerMap = window.L.map('loc-picker-map', { zoomControl: true }).setView([defaultLat, defaultLon], 13);
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://osm.org/copyright">OSM</a>'
            }).addTo(_locPickerMap);

            // Draggable marker
            _locPickerMarker = window.L.marker([defaultLat, defaultLon], { draggable: true }).addTo(_locPickerMap);
            _locPickerMarker.bindPopup('Drag me to your location').openPopup();

            const onMoved = async (e) => {
                const { lat, lng } = e.latlng || _locPickerMarker.getLatLng();
                const name = await _reverseGeocode(lat, lng);
                _setLocResolved(name, lat, lng);
                _locPickerMarker.bindPopup(`📍 ${name}`).openPopup();
                pinBtn.querySelector('.loc-option-sub').textContent = name;
            };

            _locPickerMarker.on('dragend', onMoved);
            _locPickerMap.on('click', (e) => {
                _locPickerMarker.setLatLng(e.latlng);
                onMoved(e);
            });
        }

        // Invalidate size after container becomes visible
        setTimeout(() => _locPickerMap && _locPickerMap.invalidateSize(), 100);
    });
}

// Init once DOM is ready
document.addEventListener('DOMContentLoaded', () => setTimeout(_initLocPicker, 200));
