const axios = require('axios');

async function testCF() {
    console.log("Starting Task 1.3 Live Verification (CF Endpoint)...");
    try {
        const baseUrl = process.env.BACKEND_URL || 'https://musync-backend.onrender.com';
        const res = await axios.get(`${baseUrl}/api/recommend/similar-users`, {
            headers: { 'Authorization': 'Bearer test-token' }
        });
        
        if (res.status === 200) {
            console.log("Task 1.3 Live Verification Passed!");
            process.exit(0);
        } else {
            throw new Error(`Unexpected status ${res.status}`);
        }
    } catch (e) {
        if (e.response && (e.response.status === 401 || e.response.status === 403 || e.response.status === 404)) {
            console.error(`Task 1.3 Live Verification Failed: Endpoint returned ${e.response.status}. Ensure auth is bypassed or valid for test, and route is correct.`);
            process.exit(1);
        }
        console.error("Task 1.3 Live Verification Failed:", e.message);
        process.exit(1);
    }
}
testCF();
