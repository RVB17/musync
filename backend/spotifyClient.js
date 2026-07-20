const axios = require('axios');

/**
 * Exchanges a Spotify refresh_token for a new access_token.
 * @param {string} refresh_token - The user's Spotify refresh token.
 * @returns {Promise<Object>} Contains access_token and optionally a new refresh_token.
 */
async function getAccessToken(refresh_token) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Spotify API Error (Token Exchange):", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetches the user's top artists from Spotify.
 * @param {string} accessToken - A valid Spotify access token.
 * @param {number} limit - Number of artists to fetch (max 50).
 * @returns {Promise<Array>} Array of Spotify artist objects.
 */
async function getTopArtists(accessToken, limit = 50) {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/me/top/artists?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data.items;
  } catch (error) {
    console.error("Spotify API Error (Top Artists):", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Helper to get an aggregated list of genres from the user's top artists.
 */
async function getUserTopGenres(accessToken) {
  const artists = await getTopArtists(accessToken, 50);
  const genres = new Set();
  artists.forEach(artist => {
    if (artist.genres) {
      artist.genres.forEach(g => genres.add(g));
    }
  });
  return Array.from(genres);
}

/**
 * Fetches the user's top tracks and their audio features from Spotify.
 */
async function getTopTrackFeatures(accessToken, limit = 50) {
  try {
    const tracksRes = await axios.get(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const tracks = tracksRes.data.items;
    if (tracks.length === 0) return [];
    
    const ids = tracks.map(t => t.id).join(',');
    const featuresRes = await axios.get(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    return featuresRes.data.audio_features.filter(f => f !== null);
  } catch (error) {
    console.error("Spotify API Error (Top Track Features):", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetches audio features for specific track IDs.
 */
async function getAudioFeatures(accessToken, trackIds) {
  if (!trackIds || trackIds.length === 0) return [];
  try {
    const ids = trackIds.join(',');
    const featuresRes = await axios.get(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    return featuresRes.data.audio_features.filter(f => f !== null);
  } catch (error) {
    console.error("Spotify API Error (Audio Features):", error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getAccessToken,
  getTopArtists,
  getUserTopGenres,
  getTopTrackFeatures,
  getAudioFeatures
};
