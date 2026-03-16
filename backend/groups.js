const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');

// Get all groups
router.get('/', async (req, res) => {
  const { data: groups, error } = await supabase.from('groups').select('*');
  if (error) return res.status(500).json({ error: error.message });

  // For a robust app, you would join this with the users table to get member details.
  // For now, we return the raw array of UUIDs and let the frontend fetch profiles if needed.
  res.json(groups);
});

// Create a persistent group
router.post('/', async (req, res) => {
  const { name } = req.body;
  const user = req.user.id;

  const { data: group, error } = await supabase.from('groups').insert({
    name,
    members: [user]
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(group);
});

// Join a group by code
router.post('/join', async (req, res) => {
  const { code } = req.body;
  const user = req.user.id;
  const { data: group } = await supabase.from('groups').select('*').eq('id', code).single();

  if (group && !group.members.includes(user)) {
    const members = [...(group.members || []), user];
    const { data: updated, error } = await supabase.from('groups').update({ members }).eq('id', code).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(updated);
  } else if (group) {
    res.json(group); // Already joined
  } else {
    res.status(404).json({ error: 'Group not found' });
  }
});

// Leave a group
router.post('/leave', async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;
  const { data: group } = await supabase.from('groups').select('*').eq('id', code).single();

  if (group) {
    const members = (group.members || []).filter(id => id !== userId);
    const { data: updated, error } = await supabase.from('groups').update({ members }).eq('id', code).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Group not found' });
  }
});

module.exports = router;
