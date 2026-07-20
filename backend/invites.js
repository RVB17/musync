const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');

// Invite a friend to a group
router.post('/groups/invite', async (req, res) => {
  const { groupId, toUserId } = req.body;
  const fromUserId = req.user.id; // Security fix: use authenticated user's ID
  
  const { data, error } = await supabase
    .from('group_invites')
    .insert([{ group_id: groupId, inviter_id: fromUserId, invitee_id: toUserId }]);
  
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Get group invites for a user
router.get('/groups/invites/:userId', async (req, res) => {
  const userId = req.user.id; // Security fix: fetch for the authenticated user, ignore route param
  
  const { data, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('invitee_id', userId)
    .eq('status', 'pending');
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Accept group invite
router.post('/groups/invite/accept', async (req, res) => {
  const { groupId } = req.body;
  const userId = req.user.id; // Security fix: use authenticated user's ID
  
  // 1. Fetch current group members
  const { data: group, error: fetchError } = await supabase
    .from('groups')
    .select('members')
    .eq('id', groupId)
    .single();
    
  if (fetchError || !group) return res.status(400).json({ error: 'Group not found' });
  
  const members = group.members || [];
  if (!members.includes(userId)) {
    members.push(userId);
    // 2. Update group members
    await supabase
      .from('groups')
      .update({ members })
      .eq('id', groupId);
  }
  
  // 3. Update invite status to accepted (or delete it)
  const { error: updateError } = await supabase
    .from('group_invites')
    .delete()
    .eq('group_id', groupId)
    .eq('invitee_id', userId);
    
  if (updateError) return res.status(400).json({ error: updateError.message });
  res.json({ success: true });
});

// Invite to party by code
router.post('/parties/invite', async (req, res) => {
  const { partyId, toUserId } = req.body;
  const fromUserId = req.user.id; // Security fix
  
  const { data, error } = await supabase
    .from('party_invites')
    .insert([{ party_id: partyId, inviter_id: fromUserId, invitee_id: toUserId }]);
    
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Get party invites for a user
router.get('/parties/invites/:userId', async (req, res) => {
  const userId = req.user.id; // Security fix
  
  const { data, error } = await supabase
    .from('party_invites')
    .select('*')
    .eq('invitee_id', userId)
    .eq('status', 'pending');
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Accept party invite
router.post('/parties/invite/accept', async (req, res) => {
  const { partyId } = req.body;
  const userId = req.user.id; // Security fix
  
  // 1. Fetch current party members
  const { data: party, error: fetchError } = await supabase
    .from('parties')
    .select('members')
    .eq('id', partyId)
    .single();
    
  if (fetchError || !party) return res.status(400).json({ error: 'Party not found' });
  
  const members = party.members || [];
  if (!members.includes(userId)) {
    members.push(userId);
    // 2. Update party members
    await supabase
      .from('parties')
      .update({ members })
      .eq('id', partyId);
  }
  
  // 3. Delete or update invite
  const { error: updateError } = await supabase
    .from('party_invites')
    .delete()
    .eq('party_id', partyId)
    .eq('invitee_id', userId);
    
  if (updateError) return res.status(400).json({ error: updateError.message });
  res.json({ success: true });
});

module.exports = router;
