import Geolocation from 'react-native-geolocation-service';

export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({ latitude, longitude });
            },
            (error) => {
                reject(error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    });
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