import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    const Tabs = ({ children }) => <View>{children}</View>;
    Tabs.Screen = ({ options }) => <Text>{options.title}</Text>;
    return {
        Tabs,
    };
});

let RootLayout;
try {
    RootLayout = require('../src/app/_layout').default;
} catch (e) {
    RootLayout = () => null;
}

let AppTabs;
try {
    AppTabs = require('../src/components/app-tabs').default;
} catch (e) {
    AppTabs = () => null;
}

describe('Task 5.2: Bottom Tab Navigation', () => {
    it('should render the four main tabs: Parties, Groups, Discover, and Profile', async () => {
        try {
            await render(<AppTabs />);
        } catch (e) {
            await render(<RootLayout />);
        }

        expect(screen.getByText(/parties/i)).toBeTruthy();
        expect(screen.getByText(/groups/i)).toBeTruthy();
        expect(screen.getByText(/discover/i)).toBeTruthy();
        expect(screen.getByText(/profile/i)).toBeTruthy();
    });
});
