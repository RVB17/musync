import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GroupsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Groups</Text>
            <Text>Group list goes here...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, marginBottom: 20 }
});
