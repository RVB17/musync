const express = require('express');
const router = express.Router();

let groups = [
  { id: 'g1', name: 'Best Friends', members: ['u1', 'u2'] },
  { id: 'g2', name: 'Roommates', members: ['u1'] },
];

// Expose groups for invites logic
router._groups = groups;

router.get('/', (req, res) => {
  // Populate members with user info
  const users = require('./users')._users || [];
  const groupsWithUsers = groups.map(g => ({
    ...g,
    members: g.members.map(id => users.find(u => u.id === id)).filter(Boolean)
  }));
  res.json(groupsWithUsers);
});

router.post('/', (req, res) => {
  const { name, user } = req.body;
  const group = { id: Math.random().toString(36).slice(2), name, members: [user] };
  groups.push(group);
  res.json(group);
});

router.post('/join', (req, res) => {
  const { code, user } = req.body;
  const group = groups.find(g => g.id === code);
  if (group && !group.members.includes(user)) {
    group.members.push(user);
    res.json(group);
  } else {
    res.status(404).json({ error: 'Group not found or already joined' });
  }
});

module.exports = router;
