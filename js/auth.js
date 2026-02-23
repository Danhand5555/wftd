import { $ } from './utils.js';
import { _mountSurface, _renderAllStepSuggestions } from './ui.js';
import { signInWithGoogle, getUser, signOut } from './supabase.js';

export async function _initAuth() {
    // 1. Check for Supabase Session (AI/Cloud Sync)
    const user = await getUser();
    if (user) {
        // Logged in with Google
        localStorage.setItem('wftd_alias', user.user_metadata.full_name || user.email.split('@')[0]);
        // We bypass PIN for Google Auth users as they are already verified by Google
        _unlockWorkspace(localStorage.getItem('wftd_alias'));
        return;
    }

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
    $('#btn-auth-signup')?.addEventListener('click', _handleSignup);
    $('#btn-auth-login')?.addEventListener('click', _handleLogin);
    $('#btn-google-login')?.addEventListener('click', signInWithGoogle);
    $('#btn-google-signup')?.addEventListener('click', signInWithGoogle);

    $('#btn-auth-reset')?.addEventListener('click', async () => {
        await signOut();
        localStorage.clear();
        location.reload();
    });
}

export function _handleSignup() {
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
    const job = $('#auth-job-input').value.trim();

    localStorage.setItem('wftd_alias', alias);
    localStorage.setItem('wftd_pin', pin);
    if (food) localStorage.setItem('wftd_food', food);
    if (job) localStorage.setItem('wftd_job', job);

    _unlockWorkspace(alias);
}

export function _handleLogin() {
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

export function _unlockWorkspace(alias) {
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
                // Restore hidden location state for weather
                if (data.state) {
                    $('#loc-hidden-lat').value = data.state.location_lat || 13.7563;
                    $('#loc-hidden-lon').value = data.state.location_lon || 100.5018;
                    $('#loc-hidden-name').value = data.state.location || 'Bangkok';
                }
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
        _renderAllStepSuggestions();


        // Focus first input automatically
        setTimeout(() => {
            const firstInput = $('textarea[name="directive"]');
            if (firstInput) firstInput.focus();
        }, 100);
    }, 600); // Wait for transition
}
