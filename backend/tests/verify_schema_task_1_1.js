const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../supabase_schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

let errors = [];

// 1. Check for spotify_refresh_token
if (!schemaContent.includes('spotify_refresh_token')) {
    errors.push("Missing 'spotify_refresh_token' column in schema.");
}

// Ensure sensitive columns are not in public.users without restricted select
if (/CREATE TABLE public\.users [^;]*spotify_refresh_token/s.test(schemaContent) && 
    /CREATE POLICY [^;]* ON public\.users FOR SELECT USING \(true\)/s.test(schemaContent)) {
    errors.push("Security Vulnerability: 'spotify_refresh_token' is in public.users which has a public SELECT policy. Separate it or restrict the policy.");
}

// 2. Check for group_invites and party_invites tables
if (!/CREATE\s+TABLE\s+(public\.)?group_invites/i.test(schemaContent)) {
    errors.push("Missing 'group_invites' table in schema.");
}
if (!/CREATE\s+TABLE\s+(public\.)?party_invites/i.test(schemaContent)) {
    errors.push("Missing 'party_invites' table in schema.");
}

// 3. Ensure UPDATE policies for parties and groups only allow members
if (!/CREATE POLICY[^;]+UPDATE[^;]+ON public\.parties[^;]+USING\s*\([^;]*ANY\s*\(\s*members\s*\)[^;]*\)/is.test(schemaContent)) {
    errors.push("Missing secure UPDATE policy for 'parties' table (must check ANY(members)).");
}

if (!/CREATE POLICY[^;]+UPDATE[^;]+ON public\.groups[^;]+USING\s*\([^;]*ANY\s*\(\s*members\s*\)[^;]*\)/is.test(schemaContent)) {
    errors.push("Missing secure UPDATE policy for 'groups' table (must check ANY(members)).");
}

// 4. Ensure SELECT policies for groups only allow members
if (!/CREATE POLICY[^;]+SELECT[^;]+ON public\.groups[^;]+USING\s*\([^;]*ANY\s*\(\s*members\s*\)[^;]*\)/is.test(schemaContent)) {
    errors.push("Missing secure SELECT policy for 'groups' table (must check ANY(members)).");
}

if (errors.length > 0) {
    console.error("Schema Verification Failed:");
    errors.forEach(err => console.error("- " + err));
    process.exit(1);
}

console.log("Schema Verification Passed!");
process.exit(0);
