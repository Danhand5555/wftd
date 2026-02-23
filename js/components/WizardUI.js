import { $, $$ } from '../utils.js';
import { store } from '../store/index.js';
import { _formatTo12h } from '../utils.js';
import { classifyGoalFlow, generateSuggestions } from '../services/AIService.js';

export class WizardUI {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        $$('.next-btn').forEach(btn => btn.addEventListener('click', () => this.nextStep()));
        $$('.back-btn').forEach(btn => btn.addEventListener('click', () => this.prevStep()));

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
                this.handleGoalFeedback({ target: input });
                setTimeout(() => this.nextStep(), 150);
            } else if (stepNum === "2") {
                const input = $('input[name="entities"]');
                input.value = input.value ? input.value + ', ' + val : val;
                this.handleEntitiesFeedback({ target: input });
            }
        });

        // Dynamic Feedback Bindings
        $('textarea[name="directive"]')?.addEventListener('input', this.handleGoalFeedback.bind(this));
        $('input[name="entities"]')?.addEventListener('input', this.handleEntitiesFeedback.bind(this));
        $('#agenda-container')?.addEventListener('input', this.handleAgendaFeedback.bind(this));
        $('input[name="capital"]')?.addEventListener('input', this.handleBudgetFeedback.bind(this));
        $('input[name="eod"]')?.addEventListener('input', this.handleEodFeedback.bind(this));
    }

    async nextStep() {
        const state = store.getState();
        let { currentStep, activeFlow } = state;
        const currentCard = document.querySelector(`.step-card[data-step="${currentStep}"]`);
        if (!currentCard) return; // prevent crash if step doesn't exist
        const cc = document.querySelector(`.step-card[data-step="${currentStep}"]`);
        if (!cc) return;

        const input = cc.querySelector('input, textarea');

        // Basic validation
        let isValid = true;
        if (currentStep === 4) {
            const locVal = $('#loc-hidden-name').value;
            if (!locVal) {
                this.showFeedback('fb-location', 'Please pick a starting location first.');
                isValid = false;
            }
        } else if (input && input.required && !input.value.trim()) {
            input.focus();
            isValid = false;
        }

        if (!isValid) return;

        // Special Case: Determine flow after Step 1 using AI
        if (currentStep === 1) {
            const btn = cc.querySelector('.next-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Thinking...';
            btn.disabled = true;

            const res = await classifyGoalFlow($('textarea[name="directive"]').value);
            activeFlow = res.flow;
            store.setState({ activeFlow });
            this.updateStepCounters();
            this.tailorLabels(res.isWork, res.isLeisure, res.isSocial);

            btn.innerHTML = originalText;
            btn.disabled = false;
        }

        const currentIndex = activeFlow.indexOf(currentStep);
        if (currentIndex !== -1 && currentIndex < activeFlow.length - 1) {
            cc.classList.remove('active');
            cc.classList.add('hidden-left');

            let nextStepNum = activeFlow[currentIndex + 1];

            // Dynamic Agenda Check
            if (nextStepNum === 3) {
                const entitiesVal = $('input[name="entities"]').value.trim();
                if (!entitiesVal) {
                    const nextNextIndex = currentIndex + 2;
                    if (nextNextIndex < activeFlow.length) {
                        nextStepNum = activeFlow[nextNextIndex];
                    }
                } else {
                    this.buildAgendaInputs(entitiesVal);
                }
            }

            store.setState({ currentStep: nextStepNum });
            currentStep = nextStepNum;

            const nextCard = document.querySelector(`.step-card[data-step="${currentStep}"]`);
            if (nextCard) {
                nextCard.classList.remove('hidden-right');
                nextCard.classList.add('active');

                setTimeout(() => {
                    const nextInput = nextCard.querySelector('input, textarea');
                    if (nextInput) nextInput.focus();
                }, 400);
            }
        }
    }

    prevStep() {
        const { currentStep, activeFlow } = store.getState();
        const currentIndex = activeFlow.indexOf(currentStep);

        if (currentIndex > 0) {
            const cc = document.querySelector(`.step-card[data-step="${currentStep}"]`);
            if (cc) {
                cc.classList.remove('active');
                cc.classList.add('hidden-right');
            }

            let prevStepNum = activeFlow[currentIndex - 1];

            // Dynamic Agenda Check Backward
            if (prevStepNum === 3) {
                const entitiesVal = $('input[name="entities"]').value.trim();
                if (!entitiesVal) {
                    prevStepNum = activeFlow[currentIndex - 2];
                }
            }

            store.setState({ currentStep: prevStepNum });
            const prevCard = document.querySelector(`.step-card[data-step="${prevStepNum}"]`);
            if (prevCard) {
                prevCard.classList.remove('hidden-left');
                prevCard.classList.add('active');
            }
        }
    }

    tailorLabels(isWork, isLeisure, isSocial) {
        const locLabel = document.querySelector('.step-card[data-step="4"] .majestic-label');
        const eodLabel = document.querySelector('.step-card[data-step="6"] .majestic-label');
        const notesLabel = document.getElementById('step-7-label') || document.querySelector('.step-card[data-step="7"] .majestic-label');

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

    updateStepCounters() {
        const { activeFlow } = store.getState();
        activeFlow.forEach((stepNum, index) => {
            const counter = document.querySelector(`.step-card[data-step="${stepNum}"] .step-counter`);
            if (counter) {
                counter.textContent = `${index + 1} of ${activeFlow.length}`;
            }
        });
    }

    showFeedback(nodeId, text) {
        const node = $('#' + nodeId);
        if (!node) return;
        node.textContent = text;
        if (text) {
            node.classList.add('visible');
        } else {
            node.classList.remove('visible');
        }
    }

    handleGoalFeedback(e) {
        const val = e.target.value.trim();
        const lines = val.split(/[,\n]+/).filter(l => l.trim().length > 0).length;
        let msg = '';
        if (lines === 1) msg = "Laser focus. Love to see it.";
        else if (lines === 2) msg = "Double threat. Solid play. Let's execute.";
        else if (lines >= 3) msg = "Absolute beast mode today. Let's crush it.";
        this.showFeedback('fb-directive', msg);
    }

    handleEntitiesFeedback(e) {
        const val = e.target.value.trim();
        const count = val ? val.split(',').length : 0;
        let msg = '';
        if (val.length > 0 && count === 1) msg = "One-on-one power sync.";
        else if (count > 1) msg = "Networking god. We'll balance the energy.";
        this.showFeedback('fb-entities', msg);
    }

    handleAgendaFeedback(e) {
        const val = e.target.value.trim();
        let msg = '';
        if (val.length > 0 && val.length < 15) msg = 'Short and ruthless agenda. Perfect.';
        else if (val.length >= 15) msg = 'Detailed alignment. Total clarity.';
        this.showFeedback('fb-agenda', msg);
    }

    handleBudgetFeedback(e) {
        const val = parseInt(e.target.value, 10);
        let msg = '';
        if (val === 0) msg = 'Zero spend? Respect the grind.';
        else if (val > 0 && val <= 500) msg = 'Lean operations. Smart choices.';
        else if (val > 500 && val <= 2000) msg = 'Solid budget. Real local luxury.';
        else if (val > 2000) msg = 'Big baller! Treat yourself today.';
        this.showFeedback('fb-capital', msg);
    }

    handleEodFeedback(e) {
        const val = e.target.value.trim();
        let msg = '';
        const stdTime = _formatTo12h(val);
        if (stdTime) msg = `Quitting at ${stdTime}. Locked in till then.`;
        else if (val) msg = `Format time (e.g., 9:00 PM, 21:00, 2100)`;
        this.showFeedback('fb-eod', msg);
    }

    buildAgendaInputs(entitiesStr) {
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

    async renderSuggestions() {
        const job = store.getState().userProfile.job || 'Professional';
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

        const aiData = await generateSuggestions(job);
        if (aiData) {
            if (aiData.goals) {
                aiData.goals.push({ label: 'Rest Day', val: 'Rest and mental recovery' });
                render(goalContainer, aiData.goals);
            }
            if (aiData.meets) {
                aiData.meets.push({ label: 'Skip (Solo)', val: '' });
                render(meetContainer, aiData.meets);
            }
        }
    }
}
