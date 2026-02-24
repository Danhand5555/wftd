/**
 * WFTD // Main Application Orchestrator
 * Replaces script.js, engine.js
 */

import { $, $$ } from './utils.js';
import { store } from './store/index.js';
import { _initAuth } from './auth.js';
import { _initChat } from './chat.js';
import { _handleExportCalendar } from './calendar.js';

import { generateScheduleViaAI } from './services/AIService.js';
import { getWeatherContext } from './services/WeatherService.js';
import { requestGeolocation, reverseGeocode, initMapPicker } from './services/LocationService.js';

import { WizardUI } from './components/WizardUI.js';
import { TimelineUI } from './components/TimelineUI.js';
import { WeatherUI } from './components/WeatherUI.js';
import { ModalUI } from './components/ModalUI.js';
import { TimePickerUI } from './components/TimePickerUI.js';

class App {
    constructor() {
        this.timePicker = new TimePickerUI();
        this.wizard = new WizardUI(this.timePicker);
        this.modal = new ModalUI();
        this.timeline = new TimelineUI(this.modal);
        this.weather = new WeatherUI();
    }

    async init() {
        this.bindEvents();

        await _initAuth();
        if (window.lucide) window.lucide.createIcons();
        _initChat();

        this.injectDateMeta();
        this.initLocPicker();

        // Subscribe to store changes if needed
        store.subscribe((state) => {
            // Can react to global state changes here
        });
    }

    bindEvents() {
        const engineForm = $('#engine-form');
        if (engineForm) engineForm.addEventListener('submit', (e) => this.handleCompile(e));

        const skipBtn = $('.skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                const payload = { directive: 'Standard Routine', entities: '', capital: 0, margin: 2 };
                const insights = ['Using default schedule.', 'No custom budget or limits applied.'];
                // Minimal fallback itinerary
                const itinerary = [{ time: '9:00 AM', t: 'Focus Block', d: 'Default routine.', cat: 'work', dr: '4h' }];

                const today = new Date().toDateString();
                localStorage.setItem('wftd_today_date', today);
                localStorage.setItem('wftd_today_schedule', JSON.stringify({ state: payload, itinerary, insights }));

                this.mountSurface(payload, itinerary, insights);
            });
        }

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

        const exportBtn = $('#export-cal-btn');
        if (exportBtn) exportBtn.addEventListener('click', _handleExportCalendar);

        // Smart Enter logic
        $('#engine-form')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const state = store.getState();
                const currentIndex = state.activeFlow.indexOf(state.currentStep);
                if (currentIndex !== state.activeFlow.length - 1) {
                    this.wizard.nextStep();
                } else {
                    this.handleCompile(e);
                }
            }
        });

        // Listen for Custom Events from separated components (auth.js, chat.js, etc.)
        window.addEventListener('wftd-mount-surface', (e) => {
            const { payload, itinerary, insights, weatherContext } = e.detail;
            this.mountSurface(payload || {}, itinerary || [], insights || [], weatherContext);
        });

        window.addEventListener('wftd-render-suggestions', () => {
            this.wizard.renderSuggestions();
        });
    }

    injectDateMeta() {
        const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        const metaTime = $('#meta-time');
        if (metaTime) metaTime.textContent = formatter.format(new Date());
    }

    initLocPicker() {
        const gpsBtn = $('#loc-gps-btn');
        const pinBtn = $('#loc-pin-btn');
        if (!gpsBtn || !pinBtn) return;

        const setResolved = (name, lat, lon) => {
            store.setLocation(name, lat, lon);
            $('#loc-hidden-name').value = name;
            $('#loc-hidden-lat').value = lat;
            $('#loc-hidden-lon').value = lon;
            $('#loc-resolved-name').textContent = name;
            $('#loc-resolved-coords').textContent = `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`;
            $('#loc-resolved').classList.remove('hide');
            $('#loc-resolved').style.display = 'flex';
        };

        gpsBtn.addEventListener('click', () => {
            gpsBtn.classList.add('selected'); pinBtn.classList.remove('selected');
            gpsBtn.querySelector('.loc-option-sub').textContent = 'Detecting...';
            $('#loc-map-container').classList.add('hide');

            requestGeolocation(async (lat, lon) => {
                const name = await reverseGeocode(lat, lon);
                setResolved(name, lat, lon);
                gpsBtn.querySelector('.loc-option-sub').textContent = name;
                setTimeout(() => $('#loc-resolved').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            }, () => {
                gpsBtn.querySelector('.loc-option-sub').textContent = 'Could not get location';
                gpsBtn.classList.remove('selected');
            });
        });

        // Initial center for the pin (Bangkok roughly)
        const defaultLat = 13.7563;
        const defaultLon = 100.5018;

        pinBtn.addEventListener('click', () => {
            pinBtn.classList.add('selected'); gpsBtn.classList.remove('selected');
            const mapContainer = $('#loc-map-container');
            mapContainer.classList.remove('hide');
            setTimeout(() => mapContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);

            // Initialize Leaflet Map
            initMapPicker('loc-picker-map', defaultLat, defaultLon, (name, lat, lon) => {
                setResolved(name, lat, lon);
            });
        });
    }

    async handleCompile(e) {
        if (e && e.preventDefault) e.preventDefault();

        const form = $('#engine-form');
        const data = new FormData(form);
        const payload = Object.fromEntries(data.entries());

        const submitBtn = $('#generate-schedule-btn');
        const actionDock = submitBtn ? submitBtn.closest('.action-dock') : null;
        const laborState = $('#labor-illusion-state');
        const laborText = $('#labor-illusion-text');

        // Hide standard controls, show Labor Illusion state
        if (actionDock) actionDock.style.display = 'none';
        if (laborState) {
            laborState.classList.remove('hide');

            // Sequence of psychological loading strings
            const texts = ["Aligning schedule parameters", "Analyzing location context", "Optimizing time blocks", "Finalizing itinerary"];
            let i = 0;
            this._laborInterval = setInterval(() => {
                i = (i + 1) % texts.length;
                if (laborText) laborText.textContent = texts[i] + "...";
            }, 1800);
        }

        try {
            const locState = store.getState().location;
            const profile = store.getState().userProfile;

            const weatherContext = await getWeatherContext(locState.lat, locState.lon);

            // Assume no OCR text for now unless file uploaded (TODO: hook up file service)
            const ocrText = "";

            const { itinerary, insights } = await generateScheduleViaAI(
                payload, profile.job, profile.food, locState.name, locState.lat, locState.lon, weatherContext.contextString, ocrText
            );

            // Save state
            store.setState({ itinerary, insights, payload });

            const today = new Date().toDateString();
            localStorage.setItem('wftd_today_date', today);
            localStorage.setItem('wftd_today_schedule', JSON.stringify({ state: payload, itinerary, insights }));

            this.mountSurface(payload, itinerary, insights, weatherContext);

        } catch (err) {
            console.error(err);
            alert("AI generation failed. Fallback triggered.");
            // Offline fallback logic here...
        } finally {
            // Cleanup Labor Illusion
            if (this._laborInterval) clearInterval(this._laborInterval);
            if (actionDock) actionDock.style.display = 'flex';
            if (laborState) laborState.classList.add('hide');
        }
    }

    async mountSurface(payload, itinerary, insights, weatherContext) {
        const landing = $('#landing-view');
        landing.classList.add('hide');
        landing.setAttribute('aria-hidden', 'true');

        $('#state-directive').textContent = payload.directive;
        $('#stat-capital').textContent = payload.capital ? `${payload.capital} THB` : 'None';

        // Re-compute rounded start time for UI display
        const now = new Date();
        let startMins = now.getMinutes() < 30 ? 30 : 0;
        let startHours = now.getHours();
        if (startMins === 0) startHours = (startHours + 1) % 24;
        const ampm = startHours >= 12 ? 'PM' : 'AM';
        const displayHours = startHours % 12 || 12;
        const displayMins = startMins === 0 ? '00' : '30';
        const roundedStartTime = `${displayHours}:${displayMins} ${ampm}`;

        let hoursText = payload.eod || '5:00 PM';
        hoursText = `${roundedStartTime} - ${hoursText}`;
        $('#stat-margin').textContent = hoursText;
        $('#stat-entities').textContent = payload.entities || 'Solo Session';

        const logContainer = $('#system-logs');
        logContainer.innerHTML = insights.map((i, idx) => `
            <li class="insight-item">
                <span class="insight-index">0${idx + 1}</span>
                <span class="insight-text">${i}</span>
            </li>
        `).join('');

        this.timeline.render(itinerary);

        setTimeout(() => {
            const surface = $('#app-surface');
            surface.classList.remove('hide');
            surface.removeAttribute('aria-hidden');

            if (weatherContext) {
                this.weather.render(weatherContext);
            } else {
                const locState = store.getState().location;
                getWeatherContext(locState.lat, locState.lon).then(ctx => this.weather.render(ctx));
            }

            this.timeline.startLiveTracking();

            // Re-apply icons
            if (window.lucide) window.lucide.createIcons();
        }, 300);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    // DOM is already ready
    const app = new App();
    app.init();
}
