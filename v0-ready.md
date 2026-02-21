Act as an expert frontend engineer, taking over this codebase.

The following is a highly polished, brutalist/editorial style web application using pure Vanilla JS, HTML, and CSS (Vite setup). Please use this code exactly as the foundation for our next generation.

CRITICAL INSTRUCTIONS FOR THE AI'S SCOPE:
1. The AI's ONLY job is to create the schedule and answer questions about the schedule. Do not add bloated features outside of this scope.
2. If building a new UI feature, build a clean Chat interface on the dashboard where the user can ask the AI questions about their schedule.
3. Do not remove the massive typography, the niche "Notion x Wise" contrast styles, or the `localStorage` schedule engine hookups.
Please use the following code as the starting base. This is a highly polished Vanilla JS / HTML / CSS web application for generating schedules.

### index.html
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>What's For Today (WFTD)</title>

    <!-- Typeface -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="styles.css">
</head>

<body class="surface-base">
    <!-- Main Container -->
    <main class="app-container">

        <!-- Auth Screen (Demo) -->
        <section id="auth-view" class="auth-overlay">
            <div class="auth-surface">
                <div id="auth-signup-layer">
                    <h1 class="type-h2">Initialize Workspace</h1>
                    <p class="auth-sub">Set an alias for your environment.</p>
                    <input type="text" id="auth-alias-input" class="input-brutalist" placeholder="Your Name"
                        autocomplete="off">

                    <p class="auth-sub">Dietary Preference (Optional)</p>
                    <input type="text" id="auth-food-input" class="input-brutalist" placeholder="e.g. Vegan, Keto"
                        autocomplete="off">

                    <p class="auth-sub">Primary Zone (Optional)</p>
                    <input type="text" id="auth-zone-input" class="input-brutalist" placeholder="e.g. Sukhumvit"
                        autocomplete="off">

                    <p class="auth-sub">Set a 4-digit Master PIN.</p>
                    <input type="password" id="auth-pin-setup" class="input-brutalist pin-input" maxlength="4"
                        placeholder="----" autocomplete="off" inputmode="numeric">

                    <button type="button" class="btn-solid brutal-btn" id="btn-auth-signup">Create Workspace</button>
                </div>

                <div id="auth-login-layer" class="hide">
                    <h1 class="type-h2" id="auth-welcome-back">Workspace Locked</h1>
                    <p class="auth-sub">Enter your PIN to resume.</p>
                    <input type="password" id="auth-pin-login" class="input-brutalist pin-input" maxlength="4"
                        placeholder="----" autocomplete="off" inputmode="numeric">

                    <button type="button" class="btn-solid brutal-btn" id="btn-auth-login">Unlock</button>
                    <button type="button" class="btn-ghost reset-btn" id="btn-auth-reset">Reset Workspace</button>
                </div>

                <p id="auth-error" class="feedback-txt auth-error"></p>
            </div>
        </section>

        <!-- Landing Experience (Init State) -->
        <section id="landing-view" class="landing-surface hide" aria-hidden="true">
            <form id="engine-form" class="engine-form immersive-form">
                <!-- Step 1: Goal -->
                <div class="step-card active" data-step="1">
                    <div class="step-content">
                        <span class="step-counter">1 of 6</span>
                        <label class="input-block majestic-block">
                            <span class="label-txt majestic-label" id="step-1-label">What's your main goal for
                                today?</span>
                            <div class="input-majestic-wrapper">
                                <textarea class="input-majestic textarea-majestic" name="directive"
                                    placeholder="e.g., Deep Work, Finish Project..." rows="1"
                                    autocomplete="off"></textarea>
                            </div>
                            <div class="suggestion-chips" id="goal-chips-container">
                                <button type="button" class="chip" data-value="Deep Work (Coding/Architecture)">Deep
                                    Code</button>
                                <button type="button" class="chip" data-value="Fixing bugs and tech debt">Bug
                                    Squashing</button>
                                <button type="button" class="chip" data-value="Code Review & PRs">Code Review</button>
                                <button type="button" class="chip" data-value="Rest & Recovery">Rest Day</button>
                            </div>
                            <span class="feedback-txt" id="fb-directive"></span>
                        </label>
                        <menu class="action-dock immersive-dock">
                            <button type="button" class="btn-ghost skip-btn">Skip Setup</button>
                            <button type="button" class="btn-solid next-btn">
                                Next
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </menu>
                    </div>
                </div>

                <!-- Step 2: People -->
                <div class="step-card hidden-right" data-step="2">
                    <div class="step-content">
                        <span class="step-counter">2 of 6</span>
                        <label class="input-block majestic-block">
                            <span class="label-txt majestic-label">Anyone you need to meet?</span>
                            <div class="input-majestic-wrapper">
                                <input type="text" class="input-majestic" name="entities" list="friend-suggestions"
                                    placeholder="e.g., Team Sync, John Doe" autocomplete="off">
                                <datalist id="friend-suggestions">
                                    <option value="Sarah">
                                    <option value="Mike">
                                    <option value="Alex">
                                    <option value="Design Team">
                                </datalist>
                            </div>
                            <div class="suggestion-chips">
                                <button type="button" class="chip" data-value="Sarah">Sarah</button>
                                <button type="button" class="chip" data-value="Mike">Mike</button>
                                <button type="button" class="chip" data-value="Design Team">Design Team</button>
                                <button type="button" class="chip" data-value="">Skip (Solo)</button>
                            </div>
                            <span class="feedback-txt" id="fb-entities"></span>
                        </label>
                        <menu class="action-dock immersive-dock">
                            <button type="button" class="btn-ghost back-btn">Back</button>
                            <button type="button" class="btn-solid next-btn">
                                Next
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </menu>
                    </div>
                </div>

                <!-- Step 3: Agenda (Conditional) -->
                <div class="step-card hidden-right" data-step="3">
                    <div class="step-content">
                        <span class="step-counter">3 of 6</span>
                        <label class="input-block majestic-block">
                            <span class="label-txt majestic-label">What's the main agenda for meeting them?</span>
                            <div class="input-majestic-wrapper" id="agenda-container">
                                <input type="text" class="input-majestic" name="agenda_general"
                                    placeholder="e.g., Performance Review, Pitch..." autocomplete="off">
                            </div>
                            <span class="feedback-txt" id="fb-agenda"></span>
                        </label>
                        <menu class="action-dock immersive-dock">
                            <button type="button" class="btn-ghost back-btn">Back</button>
                            <button type="button" class="btn-solid next-btn">
                                Next
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </menu>
                    </div>
                </div>

                <!-- Step 4: Location -->
                <div class="step-card hidden-right" data-step="4">
                    <div class="step-content">
                        <span class="step-counter">4 of 6</span>
                        <label class="input-block majestic-block">
                            <span class="label-txt majestic-label">Where do you prefer to work today?</span>
                            <div class="input-majestic-wrapper">
                                <input type="text" class="input-majestic" name="location"
                                    placeholder="e.g., Home Base, Cafe...">
                            </div>
                            <div class="suggestion-chips">
                                <button type="button" class="chip" data-value="Home Base">Home Base</button>
                                <button type="button" class="chip" data-value="Cafe">Cafe</button>
                                <button type="button" class="chip" data-value="Co-working Space">Co-working
                                    Space</button>
                            </div>
                            <span class="feedback-txt" id="fb-location"></span>
                        </label>
                        <menu class="action-dock immersive-dock">
                            <button type="button" class="btn-ghost back-btn">Back</button>
                            <button type="button" class="btn-solid next-btn">
                                Next
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </menu>
                    </div>
                </div>

                <!-- Step 5: Budget -->
                <div class="step-card hidden-right" data-step="5">
                    <div class="step-content">
                        <span class="step-counter">5 of 6</span>
                        <label class="input-block majestic-block">
                            <span class="label-txt majestic-label">What's your total budget today? ($)</span>
                            <div class="input-majestic-wrapper">
                                <input type="number" class="input-majestic" name="capital" placeholder="e.g. 15, 50, 0"
                                    min="0">
                            </div>
                            <span class="feedback-txt" id="fb-capital"></span>
                        </label>
                        <menu class="action-dock immersive-dock">
                            <button type="button" class="btn-ghost back-btn">Back</button>
                            <button type="button" class="btn-solid next-btn">
                                Next
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </menu>
                    </div>
                </div>

                <!-- Step 6: End of Day -->
                <div class="step-card hidden-right" data-step="6">
                    <div class="step-content">
                        <span class="step-counter">6 of 6</span>
                        <label class="input-block majestic-block">
                            <span class="label-txt majestic-label">What time do you want to wrap up today?</span>
                            <div class="input-majestic-wrapper">
                                <input type="time" class="input-majestic" name="eod" value="17:00">
                            </div>
                            <span class="feedback-txt" id="fb-eod"></span>
                        </label>
                        <menu class="action-dock immersive-dock">
                            <button type="button" class="btn-ghost back-btn">Back</button>
                            <button type="submit" class="btn-solid submit-btn">Generate Schedule <svg width="12"
                                    height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                                    stroke-linecap="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg></button>
                        </menu>
                    </div>
                </div>
            </form>
        </section>

        <!-- App Surface -->
        <main id="app-surface" class="surface-main hide" aria-hidden="true">
            <nav class="top-nav">
                <div class="brand-lockup">
                    <span class="brand-mark">WFTD</span>
                    <span class="brand-sub">Engine</span>
                </div>
                <div class="nav-utils">
                    <time id="meta-time" class="meta-txt"></time>
                    <div class="avatar-node"></div>
                </div>
            </nav>

            <section class="grid-layout">
                <aside class="panel-rail">
                    <div class="data-card">
                        <span class="card-kicker">Status</span>
                        <h1 id="state-directive" class="type-display">Waiting</h1>

                        <dl class="telemetry-list">
                            <div class="telemetry-row">
                                <dt>Budget</dt>
                                <dd id="stat-capital" class="val-green">--</dd>
                            </div>
                            <div class="telemetry-row">
                                <dt>Free Time</dt>
                                <dd id="stat-margin">--</dd>
                            </div>
                            <div class="telemetry-row">
                                <dt>Meetings</dt>
                                <dd id="stat-entities" class="val-mono">--</dd>
                            </div>
                        </dl>
                    </div>

                    <div class="data-card variant-subtle">
                        <span class="card-kicker">AI Insights</span>
                        <ul id="system-logs" class="log-list">
                            <!-- Hydrated by engine -->
                        </ul>
                    </div>
                </aside>

                <section class="panel-core">
                    <header class="core-header">
                        <h2 class="type-h3">Your Schedule</h2>
                        <div class="view-toggles" style="display: flex; gap: 8px;">
                            <button class="toggle-btn" id="regenerate-btn">Regenerate</button>
                            <button class="toggle-btn active">Timeline</button>
                        </div>
                    </header>

                    <div class="timeline-track" id="timeline-root">
                        <!-- Hydrated by engine -->
                    </div>
                </section>
            </section>
        </main>

        <!-- Schedule Detail Modal -->
        <div id="schedule-modal" class="modal-overlay hide" aria-hidden="true">
            <div class="modal-surface">
                <header class="modal-header">
                    <h3 id="modal-title" class="type-h3">Task Details</h3>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn-ghost" id="modal-edit-btn">Edit</button>
                        <button type="button" class="btn-ghost icon-btn" id="modal-close-btn">&times;</button>
                    </div>
                </header>
                <div class="modal-body">
                    <p id="modal-desc" class="modal-desc">Task description goes here.</p>

                    <div class="modal-meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">Time</span>
                            <span id="modal-time" class="meta-val val-mono">--:--</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Duration</span>
                            <span id="modal-duration" class="meta-val val-mono">--</span>
                        </div>
                    </div>

                    <div id="modal-location-container" class="modal-section hide">
                        <span class="section-kicker">Location / Link</span>
                        <div class="map-placeholder">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentcolor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span id="modal-location">Map data unavailable</span>
                        </div>

                        <div id="modal-smart-tips" class="pill-cluster" style="margin-top: 8px;">
                            <!-- Filled by JS -->
                        </div>
                    </div>

                    <div id="modal-cost-container" class="modal-section hide">
                        <span class="section-kicker">Estimated Cost</span>
                        <div class="cost-display">
                            <span id="modal-cost" class="val-green">$--</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script type="module" src="script.js"></script>
</body>

</html>```

### styles.css
```css
/* 
   WFTD // Stylesheet
   Typography: Inter
   Paradigm: Notion x Wise (High Contrast, Geometric)
*/

:root {
    /* Core primitives */
    --clr-ink: #0f0f0f;
    --clr-paper: #ffffff;
    --clr-surface: #f4f4f0;
    --clr-chrome: #e8e8e4;

    /* Wise/Notion Accents */
    --clr-brand: #9fe870;
    /* Sharp lime */
    --clr-brand-dim: #8be05c;
    --clr-alert: #ff4a00;

    /* Metrics */
    --space-px: 1px;
    --space-4: 4px;
    --space-8: 8px;
    --space-16: clamp(12px, 2vw, 16px);
    --space-24: clamp(16px, 3vw, 24px);
    --space-32: clamp(24px, 4vw, 32px);
    --space-48: clamp(32px, 5vw, 48px);

    /* Typography Scale (Fluid) */
    --tx-tiny: .7rem;
    --tx-sm: .85rem;
    --tx-base: .95rem;
    --tx-lg: clamp(1.1rem, 2vw, 1.25rem);
    --tx-xl: clamp(1.5rem, 3vw, 1.75rem);
    --tx-display: clamp(2rem, 5vw, 2.5rem);

    --wght-book: 400;
    --wght-medium: 500;
    --wght-bold: 600;

    /* Architecture */
    --ease-snappy: cubic-bezier(0.2, 0.8, 0.2, 1);
    --ease-fluid: cubic-bezier(0.4, 0, 0.2, 1);
    --radii-soft: 8px;
    --radii-hard: 2px;
}

/* Reset // Naked tags */
*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: var(--clr-surface);
    color: var(--clr-ink);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overflow-x: hidden;
}

/* Typography Classes */
.type-display {
    font-size: var(--tx-display);
    font-weight: var(--wght-bold);
    letter-spacing: -0.04em;
    line-height: 1.1;
    word-wrap: break-word;
    overflow-wrap: anywhere;
}

.type-h2 {
    font-size: var(--tx-xl);
    font-weight: var(--wght-bold);
    letter-spacing: -0.03em;
}

.type-h3 {
    font-size: var(--tx-lg);
    font-weight: var(--wght-medium);
    letter-spacing: -0.02em;
}

.type-caption {
    font-size: var(--tx-sm);
    color: #666;
    font-weight: var(--wght-book);
}

.val-mono {
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
    letter-spacing: -0.02em;
}

.val-green {
    color: #007054;
    font-weight: var(--wght-bold);
}

/* Globals */
button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
}

input {
    font-family: inherit;
}

/* -------------------------------------
   Landing Experience Architecture (Immersive)
------------------------------------- */

.landing-surface {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: var(--clr-paper);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    transition: opacity 0.8s var(--ease-fluid), visibility 0.8s;
}

.landing-surface.hide {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

/* Global Utility */
.hide {
    display: none !important;
}

.immersive-form {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Form Step Architecture (Full Page) */
.step-card {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: clamp(24px, 6vw, 80px);
    overflow-y: auto;
    opacity: 0;
    pointer-events: none;
    transform: translateY(40px);
    transition: opacity 0.6s var(--ease-snappy), transform 0.6s var(--ease-snappy);
    will-change: transform, opacity;
}

.step-card.active {
    opacity: 1;
    pointer-events: all;
    transform: translateY(0);
}

.step-card.hidden-left {
    transform: translateY(-80px);
    opacity: 0;
}

.step-card.hidden-right {
    transform: translateY(80px);
    opacity: 0;
}

.step-content {
    width: 100%;
    max-width: 800px;
    /* Wide, cinematic container */
    display: flex;
    flex-direction: column;
    gap: var(--space-24);
    margin: auto 0;
    padding: 16px 0;
}

.step-counter {
    font-size: var(--tx-sm);
    text-transform: uppercase;
    font-weight: var(--wght-bold);
    color: var(--clr-brand);
    letter-spacing: 0.1em;
    margin-bottom: var(--space-8);
}

.input-block {
    display: flex;
    flex-direction: column;
}

.majestic-label {
    font-size: clamp(32px, 5vw, 64px);
    font-weight: var(--wght-bold);
    color: var(--clr-ink);
    line-height: 1.1;
    letter-spacing: -0.03em;
    margin-bottom: var(--space-16);
    display: block;
}

/* Fallback if still using prompt text */
.prompt-text {
    font-size: clamp(32px, 5vw, 64px);
    font-weight: var(--wght-bold);
    color: var(--clr-ink);
    line-height: 1.1;
    letter-spacing: -0.03em;
}

.input-majestic-wrapper {
    position: relative;
    margin-top: var(--space-16);
}

.input-majestic {
    width: 100%;
    padding: 0;
    background: transparent;
    border: none;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
    color: var(--clr-ink);
    font-size: clamp(24px, 4vw, 48px);
    font-weight: var(--wght-bold);
    letter-spacing: -0.01em;
    line-height: 1.3;
    transition: all 0.3s var(--ease-snappy);
}

.textarea-majestic {
    resize: none;
    overflow: hidden;
}

.input-majestic::placeholder {
    color: rgba(0, 0, 0, 0.2);
}

.input-majestic:focus {
    outline: none;
    border-color: var(--clr-brand);
    box-shadow: 0 1px 0 0 var(--clr-brand);
    /* Subtle underline glow */
}

.suggestion-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
    margin-top: var(--space-24);
}

.chip {
    padding: 8px 16px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 40px;
    background: var(--clr-surface);
    font-size: var(--tx-sm);
    font-weight: var(--wght-medium);
    color: var(--clr-ink);
    transition: all 0.2s var(--ease-snappy);
}

.chip:hover {
    background: var(--clr-chrome);
    border-color: var(--clr-ink);
}

.feedback-txt {
    font-size: var(--tx-base);
    color: var(--clr-brand-dim);
    font-weight: var(--wght-medium);
    margin-top: var(--space-16);
    display: block;
    min-height: 1.5em;
    /* Reserve space */
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 0;
    transform: translateY(-8px);
}

.feedback-txt.visible {
    opacity: 1;
    transform: translateY(0);
}

.immersive-dock {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--space-48);
    margin-top: var(--space-24);
}

.btn-solid {
    background: var(--clr-ink);
    /* Give a darker, more premium button for the landing */
    color: var(--clr-surface);
    padding: 12px 24px;
    font-size: var(--tx-base);
    font-weight: var(--wght-bold);
    border-radius: var(--radii-soft);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-solid:hover {
    background: #333;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn-solid:active {
    transform: translateY(2px);
    box-shadow: none;
}

.btn-ghost {
    color: #666;
    font-size: var(--tx-sm);
    font-weight: var(--wght-medium);
    padding: 8px 16px;
    border-radius: var(--radii-soft);
    transition: background 0.2s, color 0.2s;
}

.btn-ghost:hover {
    background: var(--clr-surface);
    color: var(--clr-ink);
}


/* -------------------------------------
   Main Surface Architecture
------------------------------------- */
.surface-main {
    max-width: clamp(800px, 90vw, 1100px);
    margin: 0 auto;
    padding: var(--space-24);
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--space-32);
    opacity: 1;
    transition: opacity 0.5s var(--ease-fluid);
}

.surface-main.hide {
    opacity: 0;
    pointer-events: none;
}

.top-nav {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: var(--space-16);
    border-bottom: 2px solid var(--clr-ink);
}

.brand-lockup {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.brand-mark {
    font-weight: 900;
    font-size: var(--tx-lg);
    letter-spacing: -0.05em;
}

.brand-sub {
    font-size: var(--tx-tiny);
    text-transform: uppercase;
    font-weight: var(--wght-bold);
    color: #888;
}

.nav-utils {
    display: flex;
    align-items: center;
    gap: var(--space-16);
}

.meta-txt {
    font-size: var(--tx-sm);
    font-weight: var(--wght-medium);
    color: #555;
}

.avatar-node {
    width: 28px;
    height: 28px;
    background: radial-gradient(circle at top left, var(--clr-brand) 0%, #222 100%);
    border-radius: 50%;
}

/* Grid Topography */
.grid-layout {
    display: grid;
    grid-template-columns: minmax(280px, 3fr) 7fr;
    gap: var(--space-48);
    align-items: start;
}

/* Panel Rails */
.panel-rail {
    display: grid;
    gap: var(--space-24);
    position: sticky;
    top: var(--space-24);
    min-width: 0;
}

.data-card {
    background: var(--clr-paper);
    padding: var(--space-24);
    border: 1px solid var(--clr-chrome);
    border-radius: var(--radii-hard);
    overflow: hidden;
}

.data-card.variant-subtle {
    background: transparent;
    border-style: dashed;
}

.card-kicker {
    display: block;
    font-size: var(--tx-tiny);
    text-transform: uppercase;
    font-weight: var(--wght-bold);
    color: #888;
    margin-bottom: var(--space-8);
}

.telemetry-list {
    margin-top: var(--space-24);
    display: grid;
    gap: var(--space-16);
}

.telemetry-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: var(--tx-sm);
    border-bottom: 1px solid var(--clr-chrome);
    padding-bottom: 4px;
    min-width: 0;
    gap: 12px;
}

.telemetry-row dt {
    color: #555;
    flex-shrink: 0;
}

.telemetry-row dd {
    font-weight: var(--wght-medium);
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
}

.log-list {
    list-style: none;
    display: grid;
    gap: var(--space-8);
}

.log-list li {
    font-size: var(--tx-sm);
    color: #444;
    position: relative;
    padding-left: 12px;
}

.log-list li::before {
    content: '›';
    position: absolute;
    left: 0;
    color: var(--clr-brand-dim);
    font-weight: bold;
}

/* Core Panel / Timeline Tree */
.core-header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    margin-bottom: var(--space-32);
}

.view-toggles .toggle-btn {
    font-size: var(--tx-tiny);
    text-transform: uppercase;
    font-weight: var(--wght-bold);
    padding: 4px 8px;
    border: 1px solid var(--clr-ink);
    border-radius: 20px;
}

.toggle-btn.active {
    background: var(--clr-ink);
    color: var(--clr-surface);
}

#regenerate-btn {
    border-color: #ffcccc;
    color: var(--clr-alert);
}

#regenerate-btn:hover {
    background: var(--clr-alert);
    color: white;
    border-color: var(--clr-alert);
}

.timeline-track {
    position: relative;
    padding-left: 2ch;
}

.timeline-track::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 1px;
    background: var(--clr-ink);
    opacity: 0.15;
}

.track-node {
    position: relative;
    padding-bottom: var(--space-32);
    /* Entrance Animation Choreography */
    opacity: 0;
    transform: translateX(-10px);
    animation: driftIn 0.5s var(--ease-snappy) forwards;
}

.track-node:last-child {
    padding-bottom: 0;
}

.track-node::before {
    content: '';
    position: absolute;
    left: calc(-2ch - 2px);
    top: 5px;
    width: 5px;
    height: 5px;
    background: var(--clr-ink);
    border-radius: 50%;
}

.node-meta {
    font-size: var(--tx-sm);
    font-weight: var(--wght-bold);
    color: #666;
    margin-bottom: var(--space-4);
    display: block;
}

.node-surface {
    background: var(--clr-paper);
    border: 1px solid var(--clr-chrome);
    padding: var(--space-16);
    border-radius: var(--radii-hard);
    transition: box-shadow 0.2s, transform 0.2s;
}

.node-surface:hover {
    box-shadow: 2px 2px 0 var(--clr-brand);
    transform: translate(-1px, -1px);
    border-color: var(--clr-ink);
}

.node-surface h3 {
    font-size: var(--tx-base);
    font-weight: var(--wght-bold);
    margin-bottom: 4px;
}

/* Tracking State Modifiers */
.track-node.status-past {
    opacity: 0.4;
}

.track-node.status-past .node-surface {
    background: transparent;
    border-style: dashed;
    border-color: var(--clr-chrome);
    box-shadow: none !important;
    transform: none !important;
}

.track-node.status-active .node-surface {
    border-color: var(--clr-ink);
    box-shadow: 4px 4px 0 var(--clr-brand);
    background: var(--clr-surface);
}

.track-node.status-active::before {
    background: var(--clr-brand);
    box-shadow: 0 0 8px var(--clr-brand);
}

/* Editable Modifiers */
.editable-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.05);
    border: 1px dashed var(--clr-ink);
    border-radius: 2px;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
    padding: 2px 4px;
    margin: -3px -5px;
    outline: none;
}

.editable-input:focus {
    background: rgba(0, 0, 0, 0.1);
    border-style: solid;
}

.node-surface p {
    font-size: var(--tx-sm);
    color: #555;
    margin-bottom: var(--space-12);
}

.pill-cluster {
    display: flex;
    gap: 6px;
}

.data-pill {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: var(--wght-bold);
    letter-spacing: 0.05em;
    padding: 2px 6px;
    border-radius: 2px;
    border: 1px solid;
}

.pill-work {
    border-color: #222;
    color: #222;
    background: #e8e8e8;
}

.pill-meet {
    border-color: var(--clr-alert);
    color: var(--clr-alert);
    background: #fff0eb;
}

.pill-leisure {
    border-color: #007054;
    color: #007054;
    background: #e6f6ec;
}

@keyframes driftIn {
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* -------------------------------------
   Schedule Detail Modal
------------------------------------- */

.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(15, 15, 15, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-16);
    opacity: 1;
    visibility: visible;
    transition: opacity 0.3s var(--ease-fluid), visibility 0.3s;
}

.modal-overlay.hide {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

.modal-surface {
    background: var(--clr-paper);
    width: 100%;
    max-width: 440px;
    border-radius: 0;
    border: 2px solid var(--clr-ink);
    box-shadow: 8px 8px 0 var(--clr-ink);
    transform: translateY(0) scale(1);
    transition: transform 0.4s var(--ease-snappy);
    overflow: hidden;
}

.modal-overlay.hide .modal-surface {
    transform: translateY(20px) scale(0.98);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-16) var(--space-24);
    border-bottom: 2px solid var(--clr-ink);
    background: var(--clr-surface);
}

.icon-btn {
    font-size: 24px;
    line-height: 1;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-body {
    padding: var(--space-24);
    display: flex;
    flex-direction: column;
    gap: var(--space-24);
}

.modal-desc {
    font-size: var(--tx-base);
    color: var(--clr-ink);
}

.modal-meta-grid {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: transparent;
    padding: var(--space-16) 0;
    border-top: 2px solid var(--clr-ink);
    border-bottom: 2px solid var(--clr-ink);
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.meta-item:first-child {
    border-right: 2px solid var(--clr-ink);
    margin-right: var(--space-16);
}

.meta-label {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: var(--wght-bold);
    color: var(--clr-ink);
    letter-spacing: 0.1em;
}

.modal-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    margin-top: var(--space-8);
}

.modal-section.hide {
    display: none;
}

.section-kicker {
    font-size: 10px;
    font-weight: var(--wght-bold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--clr-paper);
    background: var(--clr-ink);
    padding: 2px 8px;
    align-self: flex-start;
}

.map-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-8);
    background: var(--clr-brand);
    border: 2px solid var(--clr-ink);
    height: 120px;
    color: var(--clr-ink);
    font-weight: var(--wght-bold);
    font-size: var(--tx-sm);
}

.cost-display {
    font-size: var(--tx-xl);
    font-weight: var(--wght-bold);
    display: flex;
    align-items: center;
    gap: 8px;
}

/* =========================================
   AUTH OVERLAY (DEMO SIGNUP/LOGIN)
   ========================================= */
.auth-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--clr-surface);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.6s var(--ease-fluid), transform 0.6s var(--ease-fluid);
}

.auth-overlay.hide {
    opacity: 0;
    transform: scale(1.05);
    pointer-events: none;
}

.auth-surface {
    max-width: 440px;
    width: 100%;
    padding: var(--space-32);
    display: flex;
    flex-direction: column;
}

.auth-sub {
    font-size: var(--tx-sm);
    color: #555;
    margin-top: 24px;
    margin-bottom: 8px;
    text-transform: uppercase;
    font-weight: var(--wght-bold);
    letter-spacing: 0.05em;
}

.input-brutalist {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 3px solid var(--clr-ink);
    font-size: var(--tx-xl);
    font-weight: var(--wght-bold);
    color: var(--clr-ink);
    padding: 8px 0;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
    letter-spacing: -0.01em;
}

.input-brutalist::placeholder {
    color: #ccc;
}

.input-brutalist:focus {
    border-color: var(--clr-brand);
}

.pin-input {
    letter-spacing: 0.5em;
    font-family: monospace;
}

.brutal-btn {
    width: 100%;
    padding: var(--space-16);
    background: var(--clr-ink);
    color: var(--clr-paper);
    border: none;
    font-size: var(--tx-lg);
    font-weight: var(--wght-bold);
    margin-top: var(--space-32);
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
}

.brutal-btn:hover {
    background: #333;
}

.brutal-btn:active {
    transform: scale(0.98);
}

.reset-btn {
    width: 100%;
    margin-top: var(--space-16);
    font-size: var(--tx-sm);
    color: #888;
    text-align: center;
}

.auth-error {
    color: var(--clr-alert);
    font-weight: var(--wght-bold);
    text-align: center;
    margin-top: 16px;
    min-height: 20px;
}

/* Media Queries Matrix */
@media (max-width: 768px) {
    .grid-layout {
        grid-template-columns: 1fr;
        gap: var(--space-32);
    }

    .panel-rail {
        position: static;
    }
}```

### script.js
```javascript
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
            if (currentStep < 6) _nextStep();
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

    if (currentStep < 6) {
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
        const apiKey = import.meta.env.VITE_VERCEL_API_KEY;
        if (!apiKey || apiKey === 'YOUR_VERCEL_API_KEY_HERE') {
            console.warn('API key missing. Falling back to local offline generation.');
            itinerary = _synthesizeItinerary(payload);
        } else {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are an expert scheduling assistant. Return ONLY a raw JSON array of schedule objects without any markdown formatting wrappers. Format exactly like this: [{\"time\":\"0900\", \"t\":\"Focus Block\", \"d\":\"Task desc\", \"cat\":\"work\", \"dr\":\"2h\", \"loc\":\"Desk\"}] Categories must be 'work' or 'leisure'." },
                        { role: "user", content: `Generate a logical, chronological daily schedule for this user data: ${JSON.stringify(payload)}. Be sure to use 24-hour time strings for "time" (e.g. "0900", "1430"). Provide ONLY the JSON array.` }
                    ]
                })
            });

            if (!response.ok) throw new Error('Network response from OpenAI was not ok');
            const rawResponse = await response.json();
            const content = rawResponse.choices[0].message.content.trim();

            // Clean markdown wrappers if hallucinated
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            itinerary = JSON.parse(cleanJson);
        }
    } catch (err) {
        console.error('AI Generation Error:', err);
        alert('AI generation failed, falling back to local local generator.');
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
}
```
