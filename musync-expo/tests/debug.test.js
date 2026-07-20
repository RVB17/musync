import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';

describe('debug', () => {
    it('shows keys', async () => {
        await render(<LoginScreen />);
        console.log(!!screen.getByPlaceholderText(/email/i));
    });
});
