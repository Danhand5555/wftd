/**
 * WFTD // Main Entry Point
 */

import { $, $$ } from './js/utils.js';
import { _initAuth } from './js/auth.js';
import { _initChat } from './js/chat.js';
import { _handleCompile, _synthesizeItinerary } from './js/engine.js';
import { CORE_REGIMEN } from './js/config.js';
import { _nextStep, _prevStep, _handleGoalFeedback, _handleEntitiesFeedback, _handleAgendaFeedback, _handleBudgetFeedback, _handleEodFeedback, _bindModalEvents, _initLocPicker, _initFileHandling } from './js/ui.js';
import { _handleExportCalendar } from './js/calendar.js';


document.addEventListener('DOMContentLoaded', _initEngine);

async function _initEngine() {
    // 1. Initialize Modules
    await _initAuth();
    if (window.lucide) window.lucide.createIcons();
    _initChat();
    setTimeout(_initLocPicker, 200);
    setTimeout(_initFileHandling, 300);

    // 2. Inject Date Meta
    const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const metaTime = $('#meta-time');
    if (metaTime) metaTime.textContent = formatter.format(new Date());

    // 3. Bindings
    const engineForm = $('#engine-form');
    if (engineForm) engineForm.addEventListener('submit', _handleCompile);

    $$('.next-btn').forEach(btn => btn.addEventListener('click', _nextStep));
    $$('.back-btn').forEach(btn => btn.addEventListener('click', _prevStep));

    const skipBtn = $('.skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', () => {
        const payload = { directive: 'Standard Routine', entities: '', capital: 0, margin: 2 };
        const insights = ['Using default schedule.', 'No custom budget or limits applied.'];
        import('./js/ui.js').then(m => {
            m._mountSurface(payload, CORE_REGIMEN, insights);
        });
    });

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

    // Suggestion Chips Binding
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        const val = chip.dataset.value;
        const stepCard = chip.closest('.step-card');
        if (!stepCard) return;
        const stepNum = stepCard.dataset.step;

        if (stepNum === "1") {
            const input = $('textarea[name="directive"]');
            input.value = val;
            _handleGoalFeedback({ target: input });
            setTimeout(_nextStep, 150);
        } else if (stepNum === "2") {
            const input = $('input[name="entities"]');
            input.value = input.value ? input.value + ', ' + val : val;
            _handleEntitiesFeedback({ target: input });
        }
    });

    // Smart Enter logic
    $('#engine-form')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            import('./js/ui.js').then(m => {
                if (!m.isLastStep()) m._nextStep();
                else _handleCompile(e);
            });
        }
    });

    // Auto-expanding Textarea
    const directiveInput = $('textarea[name="directive"]');
    if (directiveInput) {
        directiveInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // Dynamic Feedback Bindings
    $('textarea[name="directive"]')?.addEventListener('input', _handleGoalFeedback);
    $('input[name="entities"]')?.addEventListener('input', _handleEntitiesFeedback);
    $('#agenda-container')?.addEventListener('input', _handleAgendaFeedback);
    $('input[name="capital"]')?.addEventListener('input', _handleBudgetFeedback);
    $('input[name="eod"]')?.addEventListener('input', _handleEodFeedback);

    _bindModalEvents();
}
