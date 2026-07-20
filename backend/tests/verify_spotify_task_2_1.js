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

let foundSpotifyToken = false;
let foundSpotifyArtists = false;
let foundExport = false;

for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('accounts.spotify.com/api/token') && content.includes('refresh_token')) {
        foundSpotifyToken = true;
    }
    if (content.includes('api.spotify.com/v1/me/top/artists')) {
        foundSpotifyArtists = true;
    }
    // Check if the file exports anything
    if ((foundSpotifyToken || foundSpotifyArtists) && (content.includes('module.exports') || content.includes('exports.'))) {
        foundExport = true;
    }
}

let errors = [];
if (!foundSpotifyToken) errors.push("Could not find code that requests an access token using a refresh_token from 'https://accounts.spotify.com/api/token'.");
if (!foundSpotifyArtists) errors.push("Could not find code that requests top artists from 'https://api.spotify.com/v1/me/top/artists'.");
if (!foundExport) errors.push("Helper functions do not seem to be exported for use in other parts of the backend.");

if (errors.length > 0) {
    console.error("Task 2.1 Verification Failed:");
    errors.forEach(err => console.error("- " + err));
    process.exit(1);
}

console.log("Task 2.1 Verification Passed!");
process.exit(0);
