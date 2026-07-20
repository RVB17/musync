const axios = require('axios');

async function testPipeline() {
    try {
        console.log("Starting Task 2.3 Live Verification...");
        
        // Attempt to call the live API endpoint
        const baseUrl = process.env.BACKEND_URL || 'https://musync-backend.onrender.com';
        const res = await axios.post(`${baseUrl}/api/recommend/generate`, {
            groupId: 'test-group',
            genre: 'pop'
        }, {
            headers: {
                'Authorization': 'Bearer test-token' // Will hit auth middleware
            }
        });
        
        if (res.status === 200 && res.data) {
            console.log("Task 2.3 Live Verification Passed! Status:", res.status);
            process.exit(0);
        } else {
            console.error("Task 2.3 Live Verification Failed: Unexpected status", res.status);
            process.exit(1);
        }
    } catch (err) {
        // If it's a 401 because test-token is invalid, that at least means the server is running and the route exists
        if (err.response && (err.response.status === 401 || err.response.status === 403 || err.response.status === 404)) {
            console.error(`Task 2.3 Live Verification Failed: Endpoint returned ${err.response.status}. Ensure auth is bypassed or valid for test, and route is correct.`);
            process.exit(1);
        } else if (err.code === 'ECONNREFUSED') {
            console.error("Task 2.3 Live Verification Failed: Connection refused. Is the server running on port 3001?");
            process.exit(1);
        } else {
            console.error("Task 2.3 Live Verification Failed: ", err.message);
            process.exit(1);
        }
    }
}

testPipeline();
