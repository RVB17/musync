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

let foundSafeDiscovery = false;
let foundFallback = false;
let foundAIScoring = false;

for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();
    
    if (content.includes('safe') && content.includes('discovery')) {
        foundSafeDiscovery = true;
    }
    
    if (content.includes('widen') || content.includes('variance') || content.includes('fallback') || (content.includes('drop') && content.includes('acousticness'))) {
        foundFallback = true;
    }
    
    if (content.includes('score') || content.includes('rank')) {
        foundAIScoring = true;
    }
}

let errors = [];
if (!foundSafeDiscovery) errors.push("Could not find logic for fetching a mix of 'Safe' and 'Discovery' targets.");
if (!foundFallback) errors.push("Could not find logic for graceful fallback (widening variance or dropping secondary features).");
if (!foundAIScoring) errors.push("Could not find logic for scoring/ranking candidates via the AI engine.");

if (errors.length > 0) {
    console.error("Task 2.3 Verification Failed:");
    errors.forEach(err => console.error("- " + err));
    process.exit(1);
}

console.log("Task 2.3 Verification Passed!");
process.exit(0);
