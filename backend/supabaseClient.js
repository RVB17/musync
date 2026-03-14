require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
// The backend MUST use the Service Role key to bypass RLS for its own database operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl.startsWith('http')) {
    console.warn('⚠️ WARNING: Missing SUPABASE_URL in .env. Falling back to mock client.');
}

// Export the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
