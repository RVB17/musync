import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ProfileScreen from '../screens/ProfileScreen';

describe('Task 3.2: ProfileScreen Integration', () => {
    beforeEach(() => {
        global.fetch = jest.fn((url) => {
            if (url.includes('/top-tracks')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{ id: 'track1', danceability: 0.8 }])
                });
            } else if (url.includes('/build-taste')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                });
            }
            return Promise.resolve({ ok: false });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should trigger taste building by calling the backend', async () => {
        let root;
        await act(async () => {
            root = renderer.create(<ProfileScreen />);
        });
        
        const buildButton = root.root.findByProps({ title: 'Build Profile' });
        
        await act(async () => {
            buildButton.props.onPress();
        });
        
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/users/top-tracks',
            expect.any(Object)
        );
        
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/users/build-taste',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ tracks: [{ id: 'track1', danceability: 0.8 }] })
            })
        );
        
        const successMessage = root.root.findByProps({ children: 'Success! Taste profile trained successfully.' });
        expect(successMessage).toBeTruthy();
    });
});
