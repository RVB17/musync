import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function CreateGroupScreen() {
    const [groupName, setGroupName] = useState('');
    const [inviteeId, setInviteeId] = useState('');
    const [message, setMessage] = useState('');

    const handleCreate = async () => {
        try {
            const jwt = 'dummy-jwt-token';
            // 1. Create group
            const createRes = await fetch('http://localhost:3001/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
                body: JSON.stringify({ name: groupName })
            });
            const createData = await createRes.json();
            if (!createRes.ok) throw new Error(createData.error || 'Failed to create group');

            const groupId = createData.group?.id || createData.id || 'new-group';

            // 2. Invite user if provided
            if (inviteeId) {
                const inviteRes = await fetch('http://localhost:3001/api/groups/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
                    body: JSON.stringify({ groupId, toUserId: inviteeId })
                });
                const inviteData = await inviteRes.json();
                if (!inviteRes.ok) throw new Error(inviteData.error || 'Failed to invite user');
            }

            setMessage('Group created successfully!');
        } catch (error: any) {
            setMessage(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Group</Text>
            <TextInput
                style={styles.input}
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
            />
            <TextInput
                style={styles.input}
                placeholder="Invitee ID (optional)"
                value={inviteeId}
                onChangeText={setInviteeId}
            />
            <Button title="Create Group" onPress={handleCreate} />
            {message ? <Text>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, marginBottom: 20 },
    input: { borderWidth: 1, padding: 10, marginBottom: 15 }
});
