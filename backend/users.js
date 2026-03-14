const express = require('express');
const router = express.Router();
const aiClient = require('./aiServiceClient');
const supabase = require('./supabaseClient');

// Create or update user profile (sign-up)
router.post('/', async (req, res) => {
  const { id, email, username, password, bio, avatar } = req.body;
  if (!email || !username || !password) return res.status(400).json({ error: 'Email, username, and password required' });

  // Real app: use Supabase Auth for signup. We use public.users here based on existing structure.
  // Check if exists
  let { data: existingUser } = await supabase.from('users').select('*').eq('email', email).limit(1).single();

  if (existingUser) {
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (username) updates.username = username;

    const { data: updated, error } = await supabase.from('users').update(updates).eq('id', existingUser.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    const { password_hash, ...safeUser } = updated;
    return res.json(safeUser);
  } else {
    // New user
    const { data: newUser, error } = await supabase.from('users').insert({
      username,
      email,
      password_hash: password, // Mock hash logic
      bio: bio || '',
      avatar: avatar || ''
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    const { password_hash, ...safeUser } = newUser;
    return res.json(safeUser);
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;

  let query = supabase.from('users').select('*');
  if (username) query = query.eq('username', username);
  else if (email) query = query.eq('email', email);

  const { data: user, error } = await query.eq('password_hash', password).limit(1).single();

  if (user) {
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } else {
    res.status(401).json({ error: 'Invalid username/email or password' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  const { q } = req.query;
  const { data: found, error } = await supabase.from('users').select('id, username, email, avatar, bio')
    .or(`username.ilike.%${q}%,email.ilike.%${q}%`);
  if (error) return res.status(500).json({ error: error.message });
  res.json(found);
});

// Add friend
router.post('/add-friend', async (req, res) => {
  const { userId, friendId } = req.body;
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
router.post('/remove-friend', async (req, res) => {
  const { userId, friendId } = req.body;
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
router.get('/:id', async (req, res) => {
  const { data: user, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
  if (user) {
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } else res.status(404).json({ error: 'User not found' });
});

// Get friends for a user
router.get('/:id/friends', async (req, res) => {
  const { data: user } = await supabase.from('users').select('friends').eq('id', req.params.id).single();
  if (user && user.friends && user.friends.length > 0) {
    const { data: friends } = await supabase.from('users').select('id, username, email, avatar, bio').in('id', user.friends);
    res.json(friends || []);
  } else {
    res.json([]);
  }
});

// Build and save user taste profile (GMM)
router.post('/:id/build-taste', async (req, res) => {
  const { tracks } = req.body;
  if (!tracks || !Array.isArray(tracks) || tracks.length < 5) {
    return res.status(400).json({ error: 'Need at least 5 tracks to build a profile' });
  }

  const { data: user } = await supabase.from('users').select('id').eq('id', req.params.id).single();
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
