import * as Location from 'expo-location';

export const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
    }

    let location = await Location.getCurrentPositionAsync({});
    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
    };
};

export const getGroupsByLocation = async (latitude?: number, longitude?: number) => {
    // Placeholder for fetching nearby groups based on location
    // This function should interact with your backend API to get the groups
    return [
        { id: 1, name: 'Jazz Lovers', members: ['Alice', 'Bob', 'Charlie'] },
        { id: 2, name: 'Rock On', members: ['Dave', 'Eve'] },
        { id: 3, name: 'Classical Fans', members: ['Frank', 'Grace', 'Heidi'] },
    ];
};