const fs = require('fs');
const path = require('path');

const invitesPath = path.join(__dirname, '../invites.js');
const invitesContent = fs.readFileSync(invitesPath, 'utf8');

let errors = [];

// 1. Should not contain in-memory arrays
if (invitesContent.includes('let groupInvites =') || invitesContent.includes('let partyInvites =')) {
    errors.push("Still using in-memory arrays for invites. Use Supabase instead.");
}

// 2. Should use supabaseClient
if (!invitesContent.includes('supabase')) {
    errors.push("Missing import or usage of supabaseClient.");
}

// 3. Should query group_invites and party_invites
if (!invitesContent.includes("from('group_invites')") && !invitesContent.includes('from("group_invites")')) {
    errors.push("Missing queries to 'group_invites' table.");
}
if (!invitesContent.includes("from('party_invites')") && !invitesContent.includes('from("party_invites")')) {
    errors.push("Missing queries to 'party_invites' table.");
}

// 4. Check for update/insert actions
if (!invitesContent.includes('.insert(')) {
    errors.push("Missing .insert() call for creating invites.");
}
if (!invitesContent.includes('.update(') && !invitesContent.includes('.delete(')) {
    errors.push("Missing .update() or .delete() call for accepting invites.");
}

// 5. Security Check: Must validate against req.user.id to prevent IDOR
if (!invitesContent.includes('req.user.id')) {
    errors.push("Security Vulnerability: 'req.user.id' is not used. You must use req.user.id instead of trusting req.body or req.params to identify the user.");
}

if (errors.length > 0) {
    console.error("Task 1.2 Unit Verification Failed:");
    errors.forEach(err => console.error("- " + err));
    process.exit(1);
}

console.log("Task 1.2 Unit Verification Passed!");
process.exit(0);
