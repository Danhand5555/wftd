import { $, $$ } from './utils.js';
import { _mountSurface, _renderAllStepSuggestions } from './ui.js';
import { signInWithGoogle, getUser, signOut, signInWithMagicLink, supabase } from './supabase.js';

export async function _initAuth() {
    // Handle magic link callback (PKCE flow)
    if (supabase) {
        // Check for PKCE code in URL query params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            console.log('[Auth] PKCE code detected, exchanging for session...');
            try {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error('[Auth] Code exchange error:', error);
                } else if (data?.user) {
                    console.log('[Auth] Session established via PKCE');
                    // Clean the URL
                    window.history.replaceState({}, '', window.location.pathname);
                    localStorage.setItem('wftd_alias', data.user.user_metadata?.full_name || data.user.email.split('@')[0]);
                    _unlockWorkspace(localStorage.getItem('wftd_alias'));
                    return;
                }
            } catch (e) {
                console.error('[Auth] Code exchange failed:', e);
            }
        }

        // Also handle hash-based token flow (legacy)
        if (window.location.hash.includes('access_token')) {
            console.log('[Auth] Hash tokens detected, waiting for session...');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                window.history.replaceState({}, '', window.location.pathname);
                localStorage.setItem('wftd_alias', session.user.user_metadata?.full_name || session.user.email.split('@')[0]);
                _unlockWorkspace(localStorage.getItem('wftd_alias'));
                return;
            }
        }

        // Listen for future auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('[Auth] State change:', event);
            if (event === 'SIGNED_IN' && session?.user) {
                const user = session.user;
                localStorage.setItem('wftd_alias', user.user_metadata?.full_name || user.email.split('@')[0]);
                _unlockWorkspace(localStorage.getItem('wftd_alias'));
            }
        });
    }

    // 1. Check for existing Supabase Session
    const user = await getUser();
    if (user) {
        localStorage.setItem('wftd_alias', user.user_metadata.full_name || user.email.split('@')[0]);
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

    // Tab Switching Logic — scoped to parent container
    $$('.switch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const container = btn.closest('#auth-signup-layer, #auth-login-layer');
            if (!container) return;
            container.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.target;
            $('#' + target).classList.add('active');
        });
    });

    $('#btn-auth-signup')?.addEventListener('click', _handleSignup);
    $('#btn-auth-login')?.addEventListener('click', _handleLogin);

    // Magic Link Handlers
    $('#btn-magic-signup')?.addEventListener('click', () => _handleMagicLink('#auth-email-input'));
    $('#btn-magic-login')?.addEventListener('click', () => _handleMagicLink('#auth-email-login'));

    $('#btn-auth-reset')?.addEventListener('click', async () => {
        await signOut();
        localStorage.clear();
        location.reload();
    });

    // Toggle between Sign Up and Sign In
    $('#btn-goto-login')?.addEventListener('click', () => {
        $('#auth-signup-layer').classList.add('hide');
        $('#auth-login-layer').classList.remove('hide');
        $('#auth-error').textContent = '';
    });
    $('#btn-goto-signup')?.addEventListener('click', () => {
        $('#auth-login-layer').classList.add('hide');
        $('#auth-signup-layer').classList.remove('hide');
        $('#auth-error').textContent = '';
    });
}

export async function _handleMagicLink(selector) {
    const emailEl = $(selector);
    const errorNode = $('#auth-error');
    console.log('[MagicLink] Handler triggered, selector:', selector);

    if (!emailEl) {
        console.error('[MagicLink] Email element not found:', selector);
        errorNode.textContent = "Email field not found.";
        errorNode.style.cssText = 'opacity:1; transform:none; color:var(--clr-alert)';
        return;
    }

    const email = emailEl.value.trim();
    console.log('[MagicLink] Email value:', email);

    if (!email || !email.includes('@')) {
        errorNode.textContent = "Please enter a valid email address.";
        errorNode.style.cssText = 'opacity:1; transform:none; color:var(--clr-alert)';
        return;
    }

    // Check if Supabase is configured
    const { isSupabaseConfigured } = await import('./supabase.js');
    console.log('[MagicLink] Supabase configured:', isSupabaseConfigured());
    if (!isSupabaseConfigured()) {
        errorNode.textContent = "Cloud sync not configured. Set Supabase keys in .env";
        errorNode.style.cssText = 'opacity:1; transform:none; color:var(--clr-alert)';
        return;
    }

    try {
        errorNode.textContent = "Sending login link...";
        errorNode.style.cssText = 'opacity:1; transform:none; color:#555';
        console.log('[MagicLink] Calling signInWithMagicLink...');
        const result = await signInWithMagicLink(email);
        console.log('[MagicLink] Result:', result);
        errorNode.textContent = "Check your email for the login link.";
        errorNode.style.cssText = 'opacity:1; transform:none; color:#007054';
    } catch (e) {
        console.error('[MagicLink] Error:', e);
        errorNode.textContent = e.message || "Error sending link. Try again.";
        errorNode.style.cssText = 'opacity:1; transform:none; color:var(--clr-alert)';
    }
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
