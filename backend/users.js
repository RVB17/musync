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

module.exports = router;
