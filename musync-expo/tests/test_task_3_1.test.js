import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen'; 
import * as AuthSession from 'expo-auth-session';

jest.mock('expo-auth-session');

describe('Task 3.1: LoginScreen Integration', () => {
    beforeEach(() => {
        global.fetch = jest.fn(() => 
            Promise.resolve({
                json: () => Promise.resolve({ access_token: 'fake-jwt-token' })
            })
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should process auth response and call backend exchange endpoint', async () => {
        AuthSession.useAuthRequest.mockReturnValue([
            { codeVerifier: 'dummy-verifier' }, // request
            { type: 'success', params: { code: 'dummy-auth-code' } }, // response
            jest.fn() // promptAsync
        ]);
        
        render(<LoginScreen />);
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3001/auth/spotify/exchange',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('dummy-auth-code')
                })
            );
            expect(screen.getByText('Login Successful!')).toBeTruthy();
        });
    });
});
