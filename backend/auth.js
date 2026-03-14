// Backend Spotify auth - Token Exchange for Native PKCE Flow
const express = require('express');
const axios = require('axios');
const router = express.Router();

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

    res.json(response.data);
  } catch (err) {
    console.error('Spotify token exchange error:', err.response?.data || err.message);
    res.status(400).json({ error: 'Token exchange failed', details: err.response?.data || err.message });
  }
});

module.exports = router;
