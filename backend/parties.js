const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');

// Get all parties
router.get('/', async (req, res) => {
  const { data: parties, error } = await supabase.from('parties').select('*');
  if (error) return res.status(500).json({ error: error.message });

  // Optionally fetch user objects for members here, or rely on frontend to fetch details
  res.json(parties);
});

// Create a new party
router.post('/', async (req, res) => {
  const { name, vibe = 'Chill', location = { lat: 0, lng: 0 } } = req.body;
  const user = req.user.id;

  const { data: party, error } = await supabase.from('parties').insert({
    name,
    vibe,
    members: user ? [user] : [],
    location
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(party);
});

// Join a party by code
router.post('/join', async (req, res) => {
  const { code } = req.body;
  const user = req.user.id;
  const { data: party } = await supabase.from('parties').select('*').eq('id', code).single();

  if (party && !party.members.includes(user)) {
    const members = [...(party.members || []), user];
    const { data: updated, error } = await supabase.from('parties').update({ members }).eq('id', code).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(updated);
  } else if (party) {
    res.json(party); // Already joined
  } else {
    res.status(404).json({ error: 'Party not found' });
  }
});

// Leave a party
router.post('/leave', async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;
  const { data: party } = await supabase.from('parties').select('*').eq('id', code).single();

  if (party) {
    const members = (party.members || []).filter(id => id !== userId);
    const { data: updated, error } = await supabase.from('parties').update({ members }).eq('id', code).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Party not found' });
  }
});

module.exports = router;
