require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            console.error("❌ Connection failed. Supabase Error:", error.message);
        } else {
            console.log("✅ Connection successful! Keys are working.");
        }
    } catch (err) {
        console.error("❌ Unexpected Error:", err);
    }
}
testConnection();
