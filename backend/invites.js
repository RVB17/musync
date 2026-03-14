const express = require('express');
const router = express.Router();

// Demo in-memory invites for groups and parties
let groupInvites = [];
let partyInvites = [];

// Invite a friend to a group
router.post('/groups/invite', (req, res) => {
  const { groupId, fromUserId, toUserId } = req.body;
  groupInvites.push({ groupId, fromUserId, toUserId });
  res.json({ success: true });
});

// Get group invites for a user
router.get('/groups/invites/:userId', (req, res) => {
  const invites = groupInvites.filter(i => i.toUserId === req.params.userId);
  res.json(invites);
});

// Accept group invite
router.post('/groups/invite/accept', (req, res) => {
  const { groupId, userId } = req.body;
  // Add user to group (reuse groups.js logic)
  const groups = require('./groups')._groups;
  const group = groups.find(g => g.id === groupId);
  if (group && !group.members.includes(userId)) {
    group.members.push(userId);
    // Remove invite
    groupInvites = groupInvites.filter(i => !(i.groupId === groupId && i.toUserId === userId));
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Group not found or already joined' });
  }
});

// Invite to party by code
router.post('/parties/invite', (req, res) => {
  const { partyId, fromUserId, toUserId } = req.body;
  partyInvites.push({ partyId, fromUserId, toUserId });
  res.json({ success: true });
});

// Get party invites for a user
router.get('/parties/invites/:userId', (req, res) => {
  const invites = partyInvites.filter(i => i.toUserId === req.params.userId);
  res.json(invites);
});

// Accept party invite
router.post('/parties/invite/accept', (req, res) => {
  const { partyId, userId } = req.body;
  // Add user to party (reuse parties.js logic)
  const parties = require('./parties')._parties;
  const party = parties.find(p => p.id === partyId);
  if (party && !party.members.find(m => m.id === userId)) {
    party.members.push({ id: userId, name: 'Invited User', topTracks: [] });
    // Remove invite
    partyInvites = partyInvites.filter(i => !(i.partyId === partyId && i.toUserId === userId));
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Party not found or already joined' });
  }
});

module.exports = router;
