const axios = require('axios');

async function test() {
    try {
        const mockTracks = Array(5).fill(0).map((_, i) => ({
            id: `t${i}`,
            features: [0.8, 0.7, 0.6, 0.1, 0.0] // Array format mimicking frontend
        }));

        console.log('Building profile for u1...');
        await axios.post('http://127.0.0.1:3001/users/u1/build-taste', { tracks: mockTracks });

        console.log('Building profile for u2...');
        await axios.post('http://127.0.0.1:3001/users/u2/build-taste', { tracks: mockTracks });

        console.log('Requesting party recommendations for p1...');
        const candidatePool = Array(3).fill(0).map((_, i) => ({
            id: `c${i}`,
            features: [0.5, 0.5, 0.5, 0.5, 0.5] // Array format mimicking frontend
        }));

        const res = await axios.post('http://127.0.0.1:3001/api/recommend/party', {
            partyId: 'p1',
            trackPool: candidatePool
        });
        console.log('Party Recs:', JSON.stringify(res.data, null, 2));

        console.log('Testing Feedback...');
        const feedbackRes = await axios.post('http://127.0.0.1:3001/api/recommend/feedback', {
            userId: 'u1',
            track: candidatePool[0],
            action: 'like'
        });
        console.log('Feedback Res:', JSON.stringify(feedbackRes.data, null, 2));

    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    }
}

test();
