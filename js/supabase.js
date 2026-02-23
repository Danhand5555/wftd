import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase Client Initialization
 * Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.
 */
export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_'))
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Helper to check if Supabase is properly configured.
 */
export const isSupabaseConfigured = () => {
    return !!supabase;
};

/**
 * Example function to save a schedule to Supabase (Bucket integration for PDFs can follow this)
 */
export async function saveScheduleToDB(alias, scheduleData) {
    if (!supabase) {
        console.warn('Supabase not configured. Data not saved to cloud.');
        return null;
    }

    const { data, error } = await supabase
        .from('schedules')
        .insert([
            {
                alias,
                schedule: scheduleData,
                created_at: new Date()
            }
        ]);

    if (error) {
        console.error('Error saving schedule to Supabase:', error);
        return null;
    }

    return data;
}

/**
 * Auth: Sign in with Google
 */
export async function signInWithGoogle() {
    if (!supabase) return;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) console.error('Auth Error:', error.message);
    return data;
}

/**
 * Auth: Sign in with Magic Link (Email)
 */
export async function signInWithMagicLink(email, name = null) {
    if (!supabase) throw new Error('Supabase client not initialized.');
    const options = {
        emailRedirectTo: window.location.origin,
    };
    if (name) {
        options.data = { full_name: name };
    }
    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options,
    });
    if (error) throw error;
    return data;
}

/**
 * Auth: Get User
 */
export async function getUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Auth: Update user's display name in Supabase metadata
 */
export async function updateUserName(name) {
    if (!supabase || !name) return;
    const { error } = await supabase.auth.updateUser({
        data: { full_name: name }
    });
    if (error) console.error('[Supabase] Failed to update user name:', error);
    else console.log('[Supabase] User name updated to:', name);
}

/**
 * Auth: Sign Out
 */
export async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
}
