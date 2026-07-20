import React from 'react';
import renderer, { act } from 'react-test-renderer';
import PartyScreen from '../screens/PartyScreen';

jest.mock('expo-av', () => ({
    Audio: {
        Sound: {
            createAsync: jest.fn(() => Promise.resolve({
                sound: {
                    playAsync: jest.fn(),
                    stopAsync: jest.fn(),
                    unloadAsync: jest.fn(),
                }
            }))
        }
    }
}));

describe('Task 3.4: Recommendations & Playback Integration', () => {
    beforeEach(() => {
        global.fetch = jest.fn((url) => {
            if (url.includes('/api/recommend/generate')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        tracks: [
                            { name: 'Test Song', preview_url: 'http://example.com/preview.mp3' }
                        ]
                    })
                });
            }
            return Promise.resolve({ ok: false });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should fetch recommendations when a genre chip is clicked and render MusicPlayer', async () => {
        let root;
        await act(async () => {
            root = renderer.create(<PartyScreen />);
        });
        
        const popChip = root.root.findByProps({ testID: 'genre-chip-Pop' });
        
        await act(async () => {
            popChip.props.onPress();
        });
        
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/recommend/generate',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ genre: 'Pop' })
            })
        );
        
        const texts = root.root.findAllByType('Text');
        const titleText = texts.find(t => {
            const children = Array.isArray(t.props.children) ? t.props.children.join('') : t.props.children;
            return children === 'Playing: Test Song';
        });
        expect(titleText).toBeTruthy();
        
        const playButton = root.root.findByProps({ title: 'Play Preview' });
        expect(playButton).toBeTruthy();
    });
});
