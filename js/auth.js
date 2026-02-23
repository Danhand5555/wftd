import { $, $$ } from './utils.js';
import { _mountSurface, _renderAllStepSuggestions, _applyTheme } from './ui.js';
import { signInWithGoogle, getUser, signOut, signInWithMagicLink, updateUserName, supabase } from './supabase.js';

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
                    const resolvedName = data.user.user_metadata?.full_name || localStorage.getItem('wftd_alias') || data.user.email.split('@')[0];
                    localStorage.setItem('wftd_alias', resolvedName);
                    if (!data.user.user_metadata?.full_name && resolvedName) {
                        updateUserName(resolvedName);
                    }
                    _unlockWorkspace(resolvedName);
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
                const resolvedName = session.user.user_metadata?.full_name || localStorage.getItem('wftd_alias') || session.user.email.split('@')[0];
                localStorage.setItem('wftd_alias', resolvedName);
                if (!session.user.user_metadata?.full_name && resolvedName) {
                    updateUserName(resolvedName);
                }
                _unlockWorkspace(resolvedName);
                return;
            }
        }

        // Listen for future auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('[Auth] State change:', event);
            if (event === 'SIGNED_IN' && session?.user) {
                const user = session.user;
                const resolvedName = user.user_metadata?.full_name || localStorage.getItem('wftd_alias') || user.email.split('@')[0];
                localStorage.setItem('wftd_alias', resolvedName);
                if (!user.user_metadata?.full_name && resolvedName) {
                    updateUserName(resolvedName);
                }
                _unlockWorkspace(resolvedName);
            }
        });
    }

    // 1. Check for existing Supabase Session
    const user = await getUser();
    if (user) {
        const resolvedName = user.user_metadata.full_name || localStorage.getItem('wftd_alias') || user.email.split('@')[0];
        localStorage.setItem('wftd_alias', resolvedName);
        if (!user.user_metadata.full_name && resolvedName) {
            updateUserName(resolvedName);
        }
        _unlockWorkspace(resolvedName);
        return;
    }

    const alias = localStorage.getItem('wftd_alias');
    const pin = localStorage.getItem('wftd_pin');

    // Initial State: Show Choice Layer unless we have a return user or active session
    const showChoice = () => {
        $('#auth-choice-layer').classList.remove('hide');
        $('#auth-signup-layer').classList.add('hide');
        $('#auth-login-layer').classList.add('hide');
        // Reset signup sub-steps
        $('#signup-view-identity')?.classList.remove('hide');
        $('#signup-view-setup')?.classList.add('hide');
        if (window.lucide) window.lucide.createIcons();
    };

    if (alias && pin) {
        // Returning User - go direct to login
        $('#auth-choice-layer').classList.add('hide');
        $('#auth-signup-layer').classList.add('hide');
        $('#auth-login-layer').classList.remove('hide');
        $('#auth-welcome-back').textContent = 'Welcome back, ' + alias;
    } else {
        showChoice();
    }

    // Choice Listeners
    $('#btn-choice-new')?.addEventListener('click', () => {
        $('#auth-choice-layer').classList.add('hide');
        $('#auth-signup-layer').classList.remove('hide');
        if (window.lucide) window.lucide.createIcons();
    });

    $('#btn-choice-login')?.addEventListener('click', () => {
        $('#auth-choice-layer').classList.add('hide');
        $('#auth-login-layer').classList.remove('hide');
        if (window.lucide) window.lucide.createIcons();
    });

    $('#btn-choice-guest')?.addEventListener('click', () => {
        _unlockWorkspace('Guest');
    });

    // Signup Wizard Navigation
    $('#btn-signup-to-setup')?.addEventListener('click', () => {
        const alias = $('#auth-alias-input').value.trim();
        if (!alias) {
            alert("Please enter your name to continue.");
            return;
        }
        $('#signup-view-identity').classList.add('hide');
        $('#signup-view-setup').classList.remove('hide');
        if (window.lucide) window.lucide.createIcons();
    });

    $('#btn-signup-to-identity')?.addEventListener('click', () => {
        $('#signup-view-setup').classList.add('hide');
        $('#signup-view-identity').classList.remove('hide');
    });


    // Theme Initialization Logic
    const themeChips = $$('.theme-chip');
    const colors = Array.from(themeChips).map(chip => chip.dataset.color);

    const savedTheme = localStorage.getItem('wftd_theme');
    let initialTheme = savedTheme;

    if (!initialTheme) {
        // Non-repeating random logic
        const lastHint = localStorage.getItem('wftd_last_random_hint');
        const candidates = colors.filter(c => c !== lastHint);
        initialTheme = candidates[Math.floor(Math.random() * candidates.length)] || colors[0];

        // Save hint for next time (but don't make it the user's permanent theme yet)
        localStorage.setItem('wftd_last_random_hint', initialTheme);
    }

    // 2. Preview the theme
    document.documentElement.style.setProperty('--clr-brand', initialTheme);

    // 3. Set active theme chip in UI & set up listeners
    themeChips.forEach(chip => {
        const chipColor = chip.dataset.color;
        if (chipColor === initialTheme) chip.classList.add('active');
        else chip.classList.remove('active');

        chip.addEventListener('click', () => {
            themeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            _applyTheme(chipColor); // This helper saves to localStorage
        });
    });

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
    $('#btn-magic-signup')?.addEventListener('click', () => _handleMagicLink('#auth-email-input', true));
    $('#btn-magic-login')?.addEventListener('click', () => _handleMagicLink('#auth-email-login', false));

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

    // Back to Gate Listeners (Add IDs to HTML or use existing structure)
    $$('.engine-brand.clickable').forEach(brand => {
        brand.addEventListener('click', showChoice);
    });
}

export async function _handleMagicLink(selector, isSignup = false) {
    const emailEl = $(selector);
    const errorNode = $('#auth-error');
    console.log('[MagicLink] Handler triggered, selector:', selector, 'isSignup:', isSignup);

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

    // Grab the user's name from the signup form if available
    let userName = null;
    let themeColor = null;
    if (isSignup) {
        const aliasEl = $('#auth-alias-input');
        userName = aliasEl?.value.trim() || null;
        if (userName) {
            localStorage.setItem('wftd_alias', userName);
        }
        themeColor = $('.theme-chip.active')?.dataset.color || '#9fe870';
        localStorage.setItem('wftd_theme', themeColor);
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
        const result = await signInWithMagicLink(email, userName, themeColor);
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
    const themeColor = $('.theme-chip.active')?.dataset.color || '#9fe870';

    localStorage.setItem('wftd_alias', alias);
    localStorage.setItem('wftd_pin', pin);
    if (food) localStorage.setItem('wftd_food', food);
    if (job) localStorage.setItem('wftd_job', job);
    localStorage.setItem('wftd_theme', themeColor);

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

export async function _unlockWorkspace(alias) {
    $('#auth-error').textContent = "";
    const authLayer = $('#auth-view');
    authLayer.classList.add('hide');

    // If the user is authenticated via Supabase but has no full_name, prompt for it
    const user = await getUser();

    // Theme application
    const themeColor = user?.user_metadata?.theme_color || localStorage.getItem('wftd_theme');
    if (themeColor) _applyTheme(themeColor);

    if (user && !user.user_metadata?.full_name) {
        const promptedName = prompt('Welcome! What should we call you?', alias || '');
        if (promptedName && promptedName.trim()) {
            alias = promptedName.trim();
            localStorage.setItem('wftd_alias', alias);
            updateUserName(alias);
        }
    }

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
