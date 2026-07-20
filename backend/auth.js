// Backend Spotify auth - Token Exchange for Native PKCE Flow
const express = require('express');
const axios = require('axios');
const router = express.Router();
const requireAuth = require('./authMiddleware'); // Added for IDOR fix

const supabase = require('./supabaseClient'); // Add supabase client to save to DB

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * Exchanges authorization code for access/refresh tokens.
 * This is used by the mobile app after it receives a code via the musync://auth deep link.
 */
router.post('/spotify/exchange', async (req, res) => {
  const { code, codeVerifier, redirectUri } = req.body;
  console.log('Backend: Spotify exchange request received');

  try {
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token } = response.data;

    // Fetch user's Spotify profile
    const profileRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const spotifyUser = profileRes.data;
    const userId = spotifyUser.id; // Just using their spotify ID as their Supabase ID for simplicity here

    // Securely save the refresh_token to the user_private table (NOT users table)
    if (refresh_token) {
      await supabase
        .from('user_private')
        .upsert({ id: userId, spotify_refresh_token: refresh_token });
    }

    // Return a Supabase Auth session/JWT (mocked as a placeholder for now since we bypass real Supabase Auth)
    res.json({ access_token: 'supabase-jwt-placeholder', spotify_token: access_token });
  } catch (err) {
    console.error('Spotify token exchange error:', err.response?.data || err.message);
    res.status(400).json({ error: 'Token exchange failed', details: err.response?.data || err.message });
  }
});

/**
 * Uses a saved refresh_token to get a new access_token without user interaction.
 * Called automatically by the frontend when the app starts.
 */
router.post('/spotify/refresh', requireAuth, async (req, res) => {
  const userId = req.user.id; // Securely take from JWT

  try {
    // 1. Fetch the user's securely stored refresh token
    const { data: user, error: fetchError } = await supabase
      .from('user_private')
      .select('spotify_refresh_token')
      .eq('id', userId)
      .single();

    if (fetchError || !user || !user.spotify_refresh_token) {
      return res.status(404).json({ error: 'No refresh token found for user' });
    }

    // 2. Ask Spotify for a fresh access token
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: user.spotify_refresh_token,
    });

    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // We only return the access token to the frontend (refresh token stays securely on DB)
    res.json({ access_token: response.data.access_token });
  } catch (err) {
    console.error('Spotify token refresh error:', err.response?.data || err.message);
    res.status(400).json({ error: 'Token refresh failed' });
  }
});

module.exports = router;
