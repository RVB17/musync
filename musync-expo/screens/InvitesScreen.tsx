import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function InvitesScreen() {
    const [message, setMessage] = useState('');

    const handleAccept = async (inviteId: string) => {
        try {
            const jwt = 'dummy-jwt-token';
            const res = await fetch(`http://localhost:3001/api/invites/${inviteId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${jwt}` }
            });
            if (!res.ok) throw new Error('Failed to accept invite');
            setMessage('Invite accepted!');
        } catch (error: any) {
            setMessage(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pending Invites</Text>
            <Button title="Accept Sample Invite" onPress={() => handleAccept('sample-invite-id')} />
            {message ? <Text>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, marginBottom: 20 }
});
