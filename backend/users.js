const express = require('express');
const router = express.Router();
const aiClient = require('./aiServiceClient');
const supabase = require('./supabaseClient');
const requireAuth = require('./authMiddleware');

// Custom auth is fully migrated to Supabase native Auth. 
// Do not use this backend for login/signup anymore. 


// Search users
router.get('/search', requireAuth, async (req, res) => {
  const { q } = req.query;
  const { data: found, error } = await supabase.from('users').select('id, username, email, avatar, bio')
    .or(`username.ilike.%${q}%,email.ilike.%${q}%`);
  if (error) return res.status(500).json({ error: error.message });
  res.json(found);
});

// Add friend
router.post('/add-friend', requireAuth, async (req, res) => {
  const userId = req.user.id; // Securely take from JWT
  const { friendId } = req.body;

  if (!friendId) return res.status(400).json({ error: 'Missing friendId' });

  // Fetch current user's friends
  const { data: user } = await supabase.from('users').select('friends').eq('id', userId).single();
  const { data: friend } = await supabase.from('users').select('friends').eq('id', friendId).single();

  if (user && friend) {
    const userFriends = new Set(user.friends || []);
    const friendFriends = new Set(friend.friends || []);
    userFriends.add(friendId);
    friendFriends.add(userId);

    await supabase.from('users').update({ friends: Array.from(userFriends) }).eq('id', userId);
    await supabase.from('users').update({ friends: Array.from(friendFriends) }).eq('id', friendId);

    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'User or friend not found' });
  }
});

// Remove friend
router.post('/remove-friend', requireAuth, async (req, res) => {
  const userId = req.user.id; // Securely take from JWT
  const { friendId } = req.body;

  const { data: user } = await supabase.from('users').select('friends').eq('id', userId).single();
  const { data: friend } = await supabase.from('users').select('friends').eq('id', friendId).single();

  if (user && friend) {
    const userFriends = (user.friends || []).filter(id => id !== friendId);
    const friendFriends = (friend.friends || []).filter(id => id !== userId);

    await supabase.from('users').update({ friends: userFriends }).eq('id', userId);
    await supabase.from('users').update({ friends: friendFriends }).eq('id', friendId);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'User or friend not found' });
  }
});

// Get top tracks features
router.get('/top-tracks', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const { data: userPriv, error } = await supabase.from('user_private').select('spotify_refresh_token').eq('id', userId).single();
    if (error || !userPriv?.spotify_refresh_token) {
      return res.status(400).json({ error: 'No spotify refresh token found' });
    }
    
    const { getAccessToken, getTopTrackFeatures } = require('./spotifyClient');
    const { access_token } = await getAccessToken(userPriv.spotify_refresh_token);
    const tracks = await getTopTrackFeatures(access_token, 10);
    
    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});

// Get user by id
router.get('/:id', requireAuth, async (req, res) => {
  const { data: safeUser, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
  if (safeUser) {
    res.json(safeUser);
  } else res.status(404).json({ error: 'User not found' });
});

// Get friends for a user
router.get('/:id/friends', requireAuth, async (req, res) => {
  const { data: user } = await supabase.from('users').select('friends').eq('id', req.params.id).single();
  if (user && user.friends && user.friends.length > 0) {
    const { data: friends } = await supabase.from('users').select('id, username, email, avatar, bio').in('id', user.friends);
    res.json(friends || []);
  } else {
    res.json([]);
  }
});

// Build and save user taste profile (GMM)
router.post('/build-taste', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { tracks } = req.body;
  if (!tracks || !Array.isArray(tracks) || tracks.length < 5) {
    return res.status(400).json({ error: 'Need at least 5 tracks to build a profile' });
  }

  const { data: user } = await supabase.from('users').select('id').eq('id', userId).single();
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const profile = await aiClient.buildUserProfile(user.id, tracks);

    // Save to Supabase
    const { error } = await supabase.from('users').update({ gmm_profile: profile.model }).eq('id', user.id);
    if (error) throw error;

    res.json({ success: true, message: 'Taste profile trained successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build taste profile via AI Engine.' });
  }
});

// Submit batched feedback
router.post('/feedback', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { feedback } = req.body;
  if (!feedback || !Array.isArray(feedback) || feedback.length === 0) {
    return res.status(400).json({ error: 'Feedback array is required' });
  }

  try {
    // 1. Get User Profile and Spotify token
    const { data: user } = await supabase.from('users').select('gmm_profile').eq('id', userId).single();
    if (!user || !user.gmm_profile) {
      return res.status(400).json({ error: 'User GMM profile not found. Please build taste first.' });
    }

    const { data: userPriv, error: privErr } = await supabase.from('user_private').select('spotify_refresh_token').eq('id', userId).single();
    if (privErr || !userPriv?.spotify_refresh_token) {
      // Allow mocking in test environment
      if (process.env.NODE_ENV !== 'test') {
        return res.status(400).json({ error: 'No spotify refresh token found' });
      }
    }

    // 2. Fetch track features from Spotify
    let featuresList = [];
    if (process.env.NODE_ENV === 'test') {
      // Mock features for test
      featuresList = feedback.map((fb, i) => ({
        id: fb.trackId, danceability: 0.5, energy: 0.5, valence: 0.5, acousticness: 0.1, instrumentalness: 0.0
      }));
    } else {
      const { getAccessToken, getAudioFeatures } = require('./spotifyClient');
      const { access_token } = await getAccessToken(userPriv.spotify_refresh_token);
      const trackIds = feedback.map(fb => fb.trackId);
      featuresList = await getAudioFeatures(access_token, trackIds);
    }

    // 3. Map feedback to track features
    const batchedFeedbacks = feedback.map(fb => {
      const feat = featuresList.find(f => f.id === fb.trackId);
      return feat ? { trackFeatures: feat, vote: fb.vote } : null;
    }).filter(f => f !== null);

    if (batchedFeedbacks.length === 0) {
      return res.status(400).json({ error: 'Could not resolve features for the provided tracks' });
    }

    // 4. Call AI engine
    const aiRes = await aiClient.updateTasteBatched(user.gmm_profile, batchedFeedbacks);

    // 5. Save updated profile to Supabase
    const { error: updateErr } = await supabase.from('users').update({ gmm_profile: aiRes.updated_gmm }).eq('id', userId);
    if (updateErr) throw updateErr;

    res.json({ success: true, updated_gmm: aiRes.updated_gmm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update taste profile' });
  }
});

module.exports = router;
