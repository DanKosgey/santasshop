import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Use VITE_SUPABASE_ANON_KEY instead of VITE_SUPABASE_PUBLISHABLE_KEY
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.warn('Missing Supabase URL. Please set VITE_SUPABASE_URL in your .env file.');
}

if (!supabaseAnonKey) {
    console.warn('Missing Supabase Anon Key. Please set VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Validate key format
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ') && !supabaseAnonKey.startsWith('sb_')) {
    console.warn('Supabase Key may be invalid. It should start with "eyJ" or "sb_".');
}

// Create the Supabase client
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);