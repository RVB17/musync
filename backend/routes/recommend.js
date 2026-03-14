const express = require('express');
const router = express.Router();
const aiClient = require('../aiServiceClient');
const supabase = require('../supabaseClient');

// POST /api/recommend/party
router.post('/party', async (req, res) => {
  const { partyId, trackPool } = req.body;
  if (!partyId || !trackPool) return res.status(400).json({ error: 'Missing partyId or trackPool' });

  try {
    const { data: party } = await supabase.from('parties').select('*').eq('id', partyId).single();
    if (!party) return res.status(404).json({ error: 'Party not found' });

    if (!party.members || party.members.length === 0) {
      return res.status(400).json({ error: 'No members in this party.' });
    }

    const { data: partyMembers } = await supabase.from('users').select('gmm_profile').in('id', party.members);
    const validMembers = (partyMembers || []).filter(u => u.gmm_profile && Object.keys(u.gmm_profile).length > 0);

    if (validMembers.length === 0) {
      return res.status(400).json({ error: 'No members in this party have trained taste profiles.' });
    }

    // Extract just the GMM profiles for the AI Engine
    const memberProfiles = validMembers.map(u => u.gmm_profile);

    // Call the Python Microservice
    const aiResponse = await aiClient.getPartyRecommendations(memberProfiles, trackPool, party.vibe);

    // Map the AI engine scores back to the rich track objects
    const recommendations = aiResponse.recommendations.map(aiTrack => {
      const fullTrack = trackPool.find(t => t.id === aiTrack.track_id) || {};
      return { ...fullTrack, ...aiTrack };
    });

    res.json({ recommendations });
  } catch (error) {
    console.error("Party Recommendation Error:", error);
    res.status(500).json({ error: 'Failed to generate party recommendations' });
  }
});

// POST /api/recommend/group
router.post('/group', async (req, res) => {
  const { primaryUserId, secondaryUserIds, trackPool } = req.body;

  if (!primaryUserId || !secondaryUserIds || !trackPool) {
    return res.status(400).json({ error: 'Missing primaryUserId, secondaryUserIds, or trackPool' });
  }

  try {
    const { data: primaryUser } = await supabase.from('users').select('gmm_profile').eq('id', primaryUserId).single();
    if (!primaryUser || !primaryUser.gmm_profile || Object.keys(primaryUser.gmm_profile).length === 0) {
      return res.status(400).json({ error: 'Primary user missing trained taste profile.' });
    }

    const { data: secondaryUsersData } = await supabase.from('users').select('gmm_profile').in('id', secondaryUserIds);
    const validSecondaries = (secondaryUsersData || []).filter(u => u.gmm_profile && Object.keys(u.gmm_profile).length > 0);
    const secondaryProfiles = validSecondaries.map(u => u.gmm_profile);

    // Call the Python Microservice
    const aiResponse = await aiClient.getGroupRecommendations(primaryUser.gmm_profile, secondaryProfiles, trackPool);

    // Map the AI engine scores back to the rich track objects
    const recommendations = aiResponse.recommendations.map(aiTrack => {
      const fullTrack = trackPool.find(t => t.id === aiTrack.track_id) || {};
      return { ...fullTrack, ...aiTrack };
    });

    res.json({ recommendations });
  } catch (error) {
    console.error("Group Recommendation Error:", error);
    res.status(500).json({ error: 'Failed to generate group recommendations' });
  }
});

// POST /api/recommend/feedback
router.post('/feedback', async (req, res) => {
  const { userId, track, action } = req.body;
  if (!userId || !track || !action) {
    return res.status(400).json({ error: 'Missing userId, track, or action' });
  }

  try {
    const { data: user } = await supabase.from('users').select('id, gmm_profile').eq('id', userId).single();

    if (!user || !user.gmm_profile || Object.keys(user.gmm_profile).length === 0) {
      return res.status(400).json({ error: 'User missing trained taste profile.' });
    }

    // Call the Python Microservice via the Node AI Client (mapping is handled internally)
    const aiResponse = await aiClient.submitFeedback(user.gmm_profile, track, action);

    // Update the Supabase user profile with the newly scaled & shifted GMM arrays
    if (aiResponse.updated_gmm) {
      await supabase.from('users').update({ gmm_profile: aiResponse.updated_gmm }).eq('id', userId);
    }

    res.json({ success: true, message: `Feedback '${action}' applied successfully.` });
  } catch (error) {
    console.error("Feedback Process Error:", error);
    res.status(500).json({ error: 'Failed to process feedback via AI Engine' });
  }
});

module.exports = router;
