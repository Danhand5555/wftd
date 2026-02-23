import { $, $$ } from '../utils.js';
import { store } from '../store/index.js';
import { getTransportOptions } from '../services/LocationService.js';

export class ModalUI {
    constructor() {
        this.bindProfileEvents();
        this.bindScheduleEvents();
    }

    bindProfileEvents() {
        const openBtn = $('#profile-open-btn');
        const closeBtn = $('#profile-close-btn');
        const saveBtn = $('#profile-save-btn');
        const modal = $('#profile-modal');

        if (!modal) return;

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                const profile = store.getState().userProfile;
                $('#profile-alias').value = profile.alias || '';
                $('#profile-job').value = profile.job || '';
                $('#profile-food').value = profile.food || '';
                $('#profile-memory').value = profile.memory || '';

                // Set active theme chip
                const currentTheme = profile.theme || '#9fe870';
                $$('#profile-theme-picker .theme-chip').forEach(chip => {
                    if (chip.dataset.color === currentTheme) chip.classList.add('active');
                    else chip.classList.remove('active');
                });

                modal.classList.remove('hide');
                modal.setAttribute('aria-hidden', 'false');
            });
        }

        // Profile theme chip clicks
        $$('#profile-theme-picker .theme-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                $$('#profile-theme-picker .theme-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.applyTheme(chip.dataset.color);
            });
        });

        const closeModal = () => {
            modal.classList.add('hide');
            modal.setAttribute('aria-hidden', 'true');
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const newAlias = $('#profile-alias').value.trim();
                const newRole = $('#profile-job').value.trim();
                const newFood = $('#profile-food').value.trim();
                const newMemory = $('#profile-memory').value.trim();
                const newTheme = $('#profile-theme-picker .theme-chip.active')?.dataset.color;

                store.setProfile({
                    alias: newAlias,
                    job: newRole,
                    food: newFood,
                    memory: newMemory,
                    theme: newTheme
                });

                // (Optional: sync to supabase here using an event or service)

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

    bindScheduleEvents() {
        $('#modal-close-btn')?.addEventListener('click', () => this.closeDetailModal());
        $('#schedule-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'schedule-modal') this.closeDetailModal();
        });

        $('#modal-edit-btn')?.addEventListener('click', () => {
            const btn = $('#modal-edit-btn');
            const isEditing = btn.textContent === 'Save';
            const title = $('#modal-title'), desc = $('#modal-desc'), time = $('#modal-time'), duration = $('#modal-duration');

            if (!isEditing) {
                btn.textContent = 'Save';
                btn.classList.add('val-green');
                [title, desc, time, duration].forEach(el => {
                    el.contentEditable = true;
                    el.classList.add('editable-input');
                });
                title.focus();
            } else {
                btn.textContent = 'Edit';
                btn.classList.remove('val-green');
                [title, desc, time, duration].forEach(el => {
                    el.contentEditable = false;
                    el.classList.remove('editable-input');
                });
                try {
                    const idx = $('#schedule-modal').dataset.editIndex;
                    const saved = JSON.parse(localStorage.getItem('wftd_today_schedule'));
                    if (saved && saved.itinerary && saved.itinerary[idx]) {
                        saved.itinerary[idx].t = title.textContent.trim();
                        saved.itinerary[idx].d = desc.textContent.trim();
                        saved.itinerary[idx].time = time.textContent.trim();
                        saved.itinerary[idx].dr = duration.textContent.trim();
                        localStorage.setItem('wftd_today_schedule', JSON.stringify(saved));
                        // Trigger re-render through app orchestrator eventually.
                        // For now, reload to reflect edits reliably.
                        location.reload();
                    }
                } catch (err) { console.error('Error saving edits', err); }
                this.closeDetailModal();
            }
        });
    }

    applyTheme(color) {
        if (!color) return;
        document.documentElement.style.setProperty('--clr-brand', color);
        // Localstorage handled by store
    }

    openDetailModal(data, idx) {
        const modal = $('#schedule-modal');
        if (!modal) return;
        modal.dataset.editIndex = idx;

        const btn = $('#modal-edit-btn');
        btn.textContent = 'Edit';
        btn.classList.remove('val-green');
        const title = $('#modal-title'), desc = $('#modal-desc'), time = $('#modal-time'), duration = $('#modal-duration');
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
            // Simplified map logic for architecture. The full Leaflet logic goes here or delegated to MapComponent.
        } else {
            locContainer.classList.add('hide');
        }

        if (data.tips && data.tips.length > 0) {
            tipsContainer.innerHTML = data.tips.map(t => `<span class="data-pill">${t.l}: ${t.v}</span>`).join('');
            tipsContainer.classList.remove('hide');
        } else {
            tipsContainer.innerHTML = '';
            tipsContainer.classList.add('hide');
        }

        const costContainer = $('#modal-cost-container');
        const displayCost = data.cost_range || (typeof data.cost === 'number' && data.cost > 0 ? `${data.cost} THB` : null);
        if (displayCost) {
            $('#modal-cost').textContent = displayCost;
            costContainer.classList.remove('hide');
        } else {
            costContainer.classList.add('hide');
        }

        modal.classList.remove('hide');
        modal.setAttribute('aria-hidden', 'false');
    }

    closeDetailModal() {
        const modal = $('#schedule-modal');
        if (modal) {
            modal.classList.add('hide');
            modal.setAttribute('aria-hidden', 'true');
        }
    }
}
