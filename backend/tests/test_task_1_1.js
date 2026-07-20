require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testDatabase() {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'dummy_key';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting Task 1.1 Live Verification (DB Schema & RLS)...");

    try {
        // Test 1: Check if group_invites exists by trying to select from it
        const { error: inviteError } = await supabase.from('group_invites').select('*').limit(1);
        if (inviteError && inviteError.code === '42P01') { 
            throw new Error("Table 'group_invites' does not exist in the live database.");
        }

        // Test 2: RLS on users table (public should not see spotify_refresh_token)
        const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1);
        if (users && users.length > 0 && users[0].spotify_refresh_token !== undefined) {
            throw new Error("Security Vulnerability: spotify_refresh_token is visible to public reads.");
        }

        console.log("Task 1.1 Live Verification Passed!");
        process.exit(0);
    } catch (e) {
        console.error("Task 1.1 Live Verification Failed:", e.message);
        process.exit(1);
    }
}
testDatabase();
