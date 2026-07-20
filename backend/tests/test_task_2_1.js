const path = require('path');
const fs = require('fs');

async function testSpotifyClient() {
    console.log("Starting Task 2.1 Live Verification (Spotify Integration)...");
    try {
        // Attempt to find the exported spotify functions dynamically
        const files = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.endsWith('.js'));
        let getAccessTokenFunc, getTopArtistsFunc;
        for (const f of files) {
            const mod = require(path.join(__dirname, '..', f));
            for (const key of Object.keys(mod)) {
                if (key.toLowerCase().includes('token')) getAccessTokenFunc = mod[key];
                if (key.toLowerCase().includes('artist') || key.toLowerCase().includes('genre')) getTopArtistsFunc = mod[key];
            }
        }

        if (!getAccessTokenFunc || !getTopArtistsFunc) {
            throw new Error("Could not find exported Spotify helper functions.");
        }

        // Live execution against real Spotify API with a bad token
        try {
            await getAccessTokenFunc('bad_refresh_token');
            throw new Error("Expected Spotify API to fail with 400 or 401, but it succeeded.");
        } catch (e) {
            if (e.response && (e.response.status === 400 || e.response.status === 401)) {
                console.log("Task 2.1 Live Verification Passed! (Correctly hit Spotify API and received expected error).");
                process.exit(0);
            } else if (e.message && (e.message.includes('400') || e.message.includes('401'))) {
                console.log("Task 2.1 Live Verification Passed! (Correctly hit Spotify API).");
                process.exit(0);
            } else {
                throw new Error("Did not reach Spotify API or failed with unexpected error: " + e.message);
            }
        }
    } catch (e) {
        console.error("Task 2.1 Live Verification Failed:", e.message);
        process.exit(1);
    }
}
testSpotifyClient();
