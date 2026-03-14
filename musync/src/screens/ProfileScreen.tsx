import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

const ProfileScreen = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const handleEditProfile = () => {
        // Logic to edit profile
    };

    const handleViewGroups = () => {
        navigation.navigate('Groups');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Music Taste Profile</Text>
            {/* Display user's music taste data here */}
            <Button title="Edit Profile" onPress={handleEditProfile} />
            <Button title="View Your Groups" onPress={handleViewGroups} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
});

export default ProfileScreen;