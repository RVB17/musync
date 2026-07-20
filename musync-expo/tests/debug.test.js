import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AppTabs from '../src/components/app-tabs';

describe('Task 5.2 debug', () => {
    it('debugs app tabs', async () => {
        await render(<AppTabs />);
        screen.debug();
    });
});
