const fs = require('fs');
const path = require('path');

function getAllJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if (!file.includes('node_modules') && !file.includes('tests')) {
                results = results.concat(getAllJsFiles(file));
            }
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const jsFiles = getAllJsFiles(path.join(__dirname, '..'));

let foundRoute = false;
let foundSupabase = false;
let foundGetSimilar = false;
let foundReqUser = false;

for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Looking for the route definition
    if (content.includes('/api/recommend/similar-users') || content.includes('/similar-users')) {
        foundRoute = true;
        if (content.includes("from('users')") || content.includes('from("users")')) foundSupabase = true;
        if (content.includes('getSimilarUsers')) foundGetSimilar = true;
        if (content.includes('req.user.id') || content.includes('req.user?.id')) foundReqUser = true;
    }
}

let errors = [];
if (!foundRoute) errors.push("Missing route for '/similar-users' or '/api/recommend/similar-users'.");
if (!foundSupabase) errors.push("Missing Supabase query to fetch 'users' table GMM profiles within the route file.");
if (!foundReqUser) errors.push("Security: Missing usage of 'req.user.id' to identify the current user.");
if (!foundGetSimilar) errors.push("Missing call to 'getSimilarUsers' (or similar aiClient method).");

if (errors.length > 0) {
    console.error("Task 1.3 Verification Failed:");
    errors.forEach(err => console.error("- " + err));
    process.exit(1);
}

console.log("Task 1.3 Verification Passed!");
process.exit(0);
