const axios = require('axios');

// Using localhost since both run on the same machine for now
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

/**
 * Normalizes a track object to ensure it has flat feature properties for the Python AI Engine.
 */
function formatTrackForAI(track) {
    const isArray = Array.isArray(track.features);
    return {
        id: track.id,
        danceability: isArray ? (track.features[0] ?? 0.5) : (track.features?.danceability ?? 0.5),
        energy: isArray ? (track.features[1] ?? 0.5) : (track.features?.energy ?? 0.5),
        valence: isArray ? (track.features[2] ?? 0.5) : (track.features?.valence ?? 0.5),
        acousticness: isArray ? (track.features[3] ?? 0.1) : (track.features?.acousticness ?? 0.1),
        instrumentalness: isArray ? (track.features[4] ?? 0.0) : (track.features?.instrumentalness ?? 0.0),
    };
}

/**
 * Sends a user's top tracks to the Python engine to build their GMM profile.
 */
async function buildUserProfile(userId, tracks) {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/build_profile`, {
            user_id: userId,
            tracks: tracks.map(formatTrackForAI) // array of {id, danceability, energy, valence, acousticness, instrumentalness}
        });
        return response.data;
    } catch (error) {
        console.error("AI Engine Error (Build Profile):", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Recommends tracks for a Party using the Venn Diagram (Overlap) method.
 * Applies vector masks based on targetVibe.
 */
async function getPartyRecommendations(userProfiles, candidateTracks, targetVibe = "Any") {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/party/recommend`, {
            users: userProfiles, // array of GMM params
            candidate_tracks: candidateTracks.map(formatTrackForAI),
            target_vibe: targetVibe
        });
        return response.data;
    } catch (error) {
        console.error("AI Engine Error (Party Recommend):", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Recommends tracks for a Group using the Primary/Tolerance method.
 */
async function getGroupRecommendations(primaryUserProfile, secondaryUserProfiles, candidateTracks) {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/group/recommend`, {
            primary_user: primaryUserProfile,
            secondary_users: secondaryUserProfiles,
            candidate_tracks: candidateTracks.map(formatTrackForAI)
        });
        return response.data;
    } catch (error) {
        console.error("AI Engine Error (Group Recommend):", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Finds users with similar overall tastes using GMM centroid distance.
 */
async function getSimilarUsers(targetGmm, globalGmms) {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/cf/match`, {
            target_gmm: targetGmm,
            global_gmms: globalGmms
        });
        return response.data;
    } catch (error) {
        console.error("AI Engine Error (CF Match):", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Submits a like or skip for a track to dynamically shift the user's taste profile.
 */
async function submitFeedback(userGmm, trackFeatures, action) {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/feedback`, {
            user_gmm: userGmm,
            track_features: formatTrackForAI(trackFeatures), // Format single track 
            action: action
        });
        return response.data;
    } catch (error) {
        console.error("AI Engine Error (Feedback):", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Submits batched votes to the AI engine.
 */
async function updateTasteBatched(userGmm, feedbacks) {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/update-taste`, {
            user_gmm: userGmm,
            feedbacks: feedbacks.map(fb => ({
                track_features: formatTrackForAI(fb.trackFeatures),
                vote: fb.vote
            }))
        });
        return response.data;
    } catch (error) {
        console.error("AI Engine Error (Update Taste):", error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    buildUserProfile,
    getPartyRecommendations,
    getGroupRecommendations,
    getSimilarUsers,
    submitFeedback,
    updateTasteBatched
};
