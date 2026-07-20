import React from 'react';
import renderer, { act } from 'react-test-renderer';
import CreateGroupScreen from '../screens/CreateGroupScreen';

describe('Task 3.3: Groups & Invites Integration', () => {
    beforeEach(() => {
        global.fetch = jest.fn((url) => {
            if (url.includes('/api/groups/invite')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
            }
            if (url.includes('/api/groups')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'new-group-123' }) });
            }
            return Promise.resolve({ ok: false });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should trigger backend calls to create a group and invite a user', async () => {
        let root;
        await act(async () => {
            root = renderer.create(<CreateGroupScreen />);
        });
        
        const nameInput = root.root.findByProps({ placeholder: 'Group Name' });
        const inviteInput = root.root.findByProps({ placeholder: 'Invitee ID (optional)' });
        const createButton = root.root.findByProps({ title: 'Create Group' });
        
        await act(async () => {
            nameInput.props.onChangeText('My Test Group');
            inviteInput.props.onChangeText('friend-123');
        });
        
        await act(async () => {
            createButton.props.onPress();
        });
        
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/groups',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'My Test Group' })
            })
        );
        
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/groups/invite',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ groupId: 'new-group-123', toUserId: 'friend-123' })
            })
        );
        
        const successMsg = root.root.findByProps({ children: 'Group created successfully!' });
        expect(successMsg).toBeTruthy();
    });
});
