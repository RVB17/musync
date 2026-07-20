const request = require('supertest');
const express = require('express');

// We need to import the app or require the route
let app;
try {
    app = require('../index'); // if index.js exports app
} catch (e) {
    // If index.js doesn't export app, we'll setup a simple fallback 
    // just to test if the Builder exports it later.
    app = express();
}

describe('Task 5.3: Feedback Loop API', () => {
    
    it('should have a POST /api/users/feedback route that accepts batched votes', async () => {
        // We will send a mock payload with batched feedback
        const payload = {
            feedback: [
                { trackId: 'track1', vote: 1 },
                { trackId: 'track2', vote: -1 }
            ]
        };

        const res = await request(app)
            .post('/api/users/feedback')
            .set('Authorization', 'Bearer dummy-token')
            .send(payload);
            
        // We expect either 200 or 401 depending on if auth middleware is strict in test environment
        // The main goal is ensuring the route is wired up and doesn't return 404
        expect(res.status).not.toBe(404);
        
        if (res.status === 200) {
            expect(res.body).toHaveProperty('success');
        }
    });

});
