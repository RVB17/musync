import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import * as AuthSession from 'expo-auth-session';

jest.mock('expo-auth-session', () => ({
    useAuthRequest: jest.fn(() => [
        { codeVerifier: 'dummy-verifier' },
        null,
        jest.fn()
    ]),
    makeRedirectUri: jest.fn(),
}));

describe('Task 5.1: Environment & Auth Overhaul', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('LoginScreen', () => {
        it('should have email and password inputs for Supabase auth, and NOT Spotify auth', async () => {
            await render(<LoginScreen />);
            
            // Should contain inputs for email and password
            expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
            expect(screen.getByPlaceholderText(/password/i)).toBeTruthy();
            
            // Should have a sign in / sign up button
            const buttons = screen.getAllByRole('button');
            const hasLoginOrSignUp = buttons.some(b => 
                b.props.children?.toString().match(/sign|log/i) || 
                b.props.title?.match(/sign|log/i)
            );
            expect(hasLoginOrSignUp).toBeTruthy();

            // Should NOT have the old Spotify login button
            const spotifyButton = screen.queryByText(/login with spotify/i);
            expect(spotifyButton).toBeNull();
        });
    });

    describe('ProfileScreen', () => {
        it('should have a Connect Spotify button that triggers PKCE flow', async () => {
            const mockPromptAsync = jest.fn();
            AuthSession.useAuthRequest.mockReturnValue([
                { codeVerifier: 'dummy-verifier' }, // request
                null, // response (not completed yet)
                mockPromptAsync // promptAsync
            ]);
            
            await render(<ProfileScreen />);
            
            // Should contain a connect spotify button
            const connectBtn = screen.getByText(/connect spotify/i);
            expect(connectBtn).toBeTruthy();
            
            fireEvent.press(connectBtn);
            
            await waitFor(() => {
                expect(mockPromptAsync).toHaveBeenCalled();
            });
        });
    });
});
