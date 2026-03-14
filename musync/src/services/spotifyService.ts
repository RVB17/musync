import axios from 'axios';

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

const spotifyApi = axios.create({
    baseURL: SPOTIFY_API_BASE_URL,
});

export const authenticateSpotify = (authToken: string) => {
    spotifyApi.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
};

export const fetchUserListeningData = async () => {
    try {
        const response = await spotifyApi.get('/me/top/artists');
        return response.data;
    } catch (error) {
        console.error('Error fetching user listening data:', error);
        throw error;
    }
};

export const fetchUserPlaylists = async () => {
    try {
        const response = await spotifyApi.get('/me/playlists');
        return response.data;
    } catch (error) {
        console.error('Error fetching user playlists:', error);
        throw error;
    }
};