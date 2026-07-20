const axios = require('axios');

async function testAuthEndpoint() {
    console.log("Starting Task 3.1 Backend Live Verification...");
    
    const baseUrl = process.env.BACKEND_URL || 'https://musync-backend.onrender.com';
    let failed = false;
    
    try {
        const res = await axios.post(`${baseUrl}/auth/spotify/exchange`, {
            code: 'dummy_code',
            userId: 'some-random-id' // A secure endpoint should ignore or reject this
        });
        
        if (res.status === 200) {
            console.error("Task 3.1 Verification Failed: /auth/spotify/exchange returned 200 for a dummy code. It must not blindly trust inputs.");
            failed = true;
        }
    } catch (e) {
        if (e.response && (e.response.status === 400 || e.response.status === 401)) {
            console.log("Passed /auth/spotify/exchange check.");
        } else {
            console.error(`Task 3.1 Verification Failed on exchange: Expected 400/401, got ${e.response ? e.response.status : e.message}`);
            failed = true;
        }
    }

    try {
        // Unauthenticated request to /auth/spotify/refresh with spoofed userId
        const res = await axios.post(`${baseUrl}/auth/spotify/refresh`, {
            userId: 'some-random-id'
        });
        
        // If it succeeds or returns 200, it's vulnerable to IDOR / missing auth.
        if (res.status === 200) {
            console.error("Task 3.1 Verification Failed: /auth/spotify/refresh allowed unauthenticated access and blindly trusted req.body.userId.");
            failed = true;
        }
    } catch (e) {
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
            console.log("Passed /auth/spotify/refresh auth check (returned 401/403).");
        } else {
            console.error(`Task 3.1 Verification Failed on refresh: Expected 401, got ${e.response ? e.response.status : e.message}`);
            failed = true;
        }
    }

    if (failed) process.exit(1);
    console.log("Task 3.1 Backend Verification Passed!");
    process.exit(0);
}
testAuthEndpoint();
