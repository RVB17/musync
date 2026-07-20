import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MusicPlayer from '../components/MusicPlayer'; 

jest.mock('expo-av', () => ({
    Audio: {
        Sound: {
            createAsync: jest.fn(() => Promise.resolve({ sound: { playAsync: jest.fn(), stopAsync: jest.fn(), unloadAsync: jest.fn() } }))
        }
    }
}));

describe('Task 5.4: Feedback UI', () => {
    beforeEach(() => {
        global.fetch = jest.fn(() => 
            Promise.resolve({
                json: () => Promise.resolve({ success: true })
            })
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should send a batched request after 5 votes', async () => {
        const dummyTrack = { id: 'track1', name: 'Song', artist: 'Artist', previewUrl: 'http' };
        
        // Pass dummy track or context if MusicPlayer expects props, 
        // though typically it might read from state/context. We'll render it directly.
        await render(<MusicPlayer currentTrack={dummyTrack} />);
        
        // Ensure buttons exist
        const upButton = await screen.findByText(/thumbs up/i);
        const downButton = await screen.findByText(/thumbs down/i);
        
        expect(upButton).toBeTruthy();
        expect(downButton).toBeTruthy();
        
        // Press 5 times
        fireEvent.press(upButton);
        fireEvent.press(downButton);
        fireEvent.press(upButton);
        fireEvent.press(upButton);
        fireEvent.press(upButton); // 5th press should trigger batch

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/feedback'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('vote')
                })
            );
        });
    });
});
