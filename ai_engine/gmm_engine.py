import numpy as np
import pandas as pd
from sklearn.mixture import GaussianMixture
from typing import List, Dict, Any

def apply_vibe_penalty(track_features: Any, vibe: str) -> float:
    """
    Applies a mathematical scalar penalty (0.0 to 1.0) based on the target vibe.
    """
    if not vibe or vibe == "Any":
        return 1.0
        
    vibe = vibe.lower()
    if vibe == "energetic":
        if track_features.energy < 0.6:
            return 0.1 # 90% penalty to low-energy songs
        elif track_features.danceability < 0.5:
            return 0.5 # 50% penalty to hard-to-dance songs
    elif vibe == "chill":
        if track_features.energy > 0.6:
            return 0.1 # 90% penalty to high-energy songs
    elif vibe == "acoustic":
        if track_features.acousticness < 0.5:
            return 0.1
            
    return 1.0

def extract_features(tracks: List[Any]) -> np.ndarray:
    """Converts a list of TrackFeatures into a NumPy array for clustering."""
    data = []
    for t in tracks:
        # We only use the 5 key dimensions
        data.append([t.danceability, t.energy, t.valence, t.acousticness, t.instrumentalness])
    return np.array(data)

def fit_user_gmm(tracks: List[Any], n_components: int = 3) -> Dict[str, Any]:
    """
    Fits a Gaussian Mixture Model to a user's track history.
    """
    X = extract_features(tracks)
    
    # If the user has fewer tracks than components, adjust the components down
    actual_components = min(n_components, len(tracks))
    
    gmm = GaussianMixture(n_components=actual_components, covariance_type='full', random_state=42)
    gmm.fit(X)
    
    # We must serialize the NumPy arrays into standard Python lists to send over JSON to the Node backend
    model_params = {
        "weights": gmm.weights_.tolist(),       # Importance of each cluster
        "means": gmm.means_.tolist(),           # The center of each cluster in 5D space
        "covariances": gmm.covariances_.tolist() # The spread/variance of each cluster
    }
    return model_params

def rebuild_gmm(params: Dict[str, Any]) -> GaussianMixture:
    """Helper function to reconstruct a scikit-learn GMM object from JSON parameters."""
    n_components = len(params["weights"])
    gmm = GaussianMixture(n_components=n_components, covariance_type='full')
    
    # We have to "hack" the fit by setting the parameters manually, 
    # normally sklearn prevents this before calling .fit()
    gmm.weights_ = np.array(params["weights"])
    gmm.means_ = np.array(params["means"])
    gmm.covariances_ = np.array(params["covariances"])
    gmm.precisions_cholesky_ = np.linalg.cholesky(np.linalg.inv(gmm.covariances_))
    return gmm

def compute_party_overlap(users: List[Dict[str, Any]], candidate_tracks: List[Any], target_vibe: str = "Any") -> List[Dict[str, Any]]:
    """
    Threshold Voting with Misery Penalty.
    
    Instead of multiplying probabilities (which collapses to ~0 in large groups),
    this counts how many users "enjoy" each track (threshold voting) while applying
    a penalty proportional to how many users actively dislike it (misery penalty).
    
    This scales well to large groups: a track loved by 12/15 people beats one
    mildly liked by all 15, but tracks that anyone truly hates get penalized.
    """
    if not users or not candidate_tracks:
        return []
    
    # Thresholds for scoring individual user enjoyment
    ENJOY_THRESHOLD = 0.3    # User "enjoys" the track if their score >= this
    MISERY_THRESHOLD = 0.05  # User actively dislikes if their score < this
    
    models = [rebuild_gmm(u) for u in users]
    X_candidates = extract_features(candidate_tracks)
    scores = []
    
    for i, track_features in enumerate(X_candidates):
        raw_track = candidate_tracks[i]
        user_scores = []
        
        for gmm in models:
            log_prob = gmm.score_samples([track_features])[0]
            prob = min(1.0, np.exp(log_prob / 5.0))
            user_scores.append(prob)
        
        # 1. Threshold Voting: how many users enjoy this track?
        votes = sum(1 for s in user_scores if s >= ENJOY_THRESHOLD)
        vote_ratio = votes / len(models)
        
        # 2. Misery Penalty: penalize tracks that some users actively hate
        #    Squared so 1 hater is a mild penalty, but 3+ haters is severe
        miserable = sum(1 for s in user_scores if s < MISERY_THRESHOLD)
        misery_penalty = (1.0 - miserable / len(models)) ** 2
        
        # 3. Average score across all users (for tiebreaking)
        avg_score = float(np.mean(user_scores))
        
        # 4. Apply Vibe Modifier Mask
        vibe_multiplier = apply_vibe_penalty(raw_track, target_vibe)
        
        # 5. Combined score: vote ratio is primary signal, avg for nuance,
        #    misery penalty ensures we don't alienate anyone, vibe filters context
        party_score = (vote_ratio * 0.6 + avg_score * 0.4) * misery_penalty * vibe_multiplier
        
        scores.append({
            "track_id": candidate_tracks[i].id,
            "party_score": float(party_score),
            "votes": votes,
            "total_users": len(models),
            "misery_count": miserable,
            "avg_score": avg_score,
            "individual_scores": [float(s) for s in user_scores],
            "vibe_multiplier": float(vibe_multiplier)
        })
    
    scores.sort(key=lambda x: x["party_score"], reverse=True)
    return scores

def compute_group_recommendation(primary_user: Dict[str, Any], secondary_users: List[Dict[str, Any]], candidate_tracks: List[Any]) -> List[Dict[str, Any]]:
    """
    The "Tolerance" method. The track is for the primary user, but heavily penalized if secondary users hate it.
    """
    primary_gmm = rebuild_gmm(primary_user)
    secondary_gmms = [rebuild_gmm(u) for u in secondary_users]
    
    X_candidates = extract_features(candidate_tracks)
    scores = []
    
    for i, track_features in enumerate(X_candidates):
        # 1. How much does the PRIMARY user like it?
        primary_log_prob = primary_gmm.score_samples([track_features])[0]
        primary_prob = np.exp(primary_log_prob)
        
        # 2. Do the secondary users hate it?
        penalty = 1.0
        for gmm in secondary_gmms:
            sec_prob = np.exp(gmm.score_samples([track_features])[0])
            # If the secondary user's probability is extremely low (e.g. < 0.01), apply a penalty
            if sec_prob < 0.01:
                penalty *= 0.5 # Halve the total score for every hater
                
        final_score = primary_prob * penalty
        
        scores.append({
            "track_id": candidate_tracks[i].id,
            "group_score": float(final_score),
            "primary_score": float(primary_prob),
            "penalty_applied": float(penalty)
        })
        
    scores.sort(key=lambda x: x["group_score"], reverse=True)
    return scores

def compute_cf_distance(target_gmm: Dict[str, Any], global_gmms: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Weighted sum of all cluster-pair similarities.
    
    Instead of collapsing each user's multi-cluster GMM into a single centroid
    (which loses information about multi-modal tastes), this compares every cluster
    in User A against every cluster in User B. A jazz+metal fan will match other
    jazz fans AND other metal fans, rather than appearing as a generic "pop" centroid.
    
    The similarity between each pair of clusters is weighted by both clusters'
    importance (GMM weights), so dominant taste clusters contribute more.
    """
    if "weights" not in target_gmm:
        return []
    
    target_means = np.array(target_gmm["means"])
    target_weights = np.array(target_gmm["weights"])
    results = []
    
    for global_id, gmm_params in global_gmms.items():
        if not gmm_params or "means" not in gmm_params:
            continue
        
        other_means = np.array(gmm_params["means"])
        other_weights = np.array(gmm_params["weights"])
        
        # Compare every cluster in target against every cluster in other user
        total_similarity = 0.0
        for i, t_mean in enumerate(target_means):
            for j, o_mean in enumerate(other_means):
                # Euclidean distance between this pair of clusters
                dist = np.linalg.norm(t_mean - o_mean)
                pair_sim = 1.0 / (1.0 + dist)
                
                # Weight by how important each cluster is to its user
                total_similarity += pair_sim * target_weights[i] * other_weights[j]
        
        results.append({
            "user_id": global_id,
            "similarity": float(total_similarity)
        })
    
    # Sort highest similarity (closest users) first
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results

def apply_feedback(user_gmm: Dict[str, Any], track_features: Any, action: str) -> Dict[str, Any]:
    """
    Dynamically shifts the GMM cluster weights/means based on a 'like' or 'skip'.
    """
    if "weights" not in user_gmm:
        return user_gmm
    
    # Rebuild GMM to use predict_proba
    gmm = rebuild_gmm(user_gmm)
    X = extract_features([track_features])
    
    # Get the probability of the track belonging to each cluster
    probs = gmm.predict_proba(X)[0]
    
    # Current parameters
    weights = np.array(user_gmm["weights"])
    means = np.array(user_gmm["means"])
    
    # How drastically to shift the taste profile per action
    learning_rate = 0.1
    
    action = action.lower()
    if action == "like":
        # Boost weights of the clusters this track fits into
        weights += learning_rate * probs
        # Shift the center of the clusters slightly closer to this actual track's features
        for i in range(len(means)):
            means[i] += learning_rate * probs[i] * (X[0] - means[i])
    elif action == "skip":
        # Penalize weights of the clusters this track fits into
        weights -= learning_rate * probs
        # Prevent weights from collapsing to 0 completely (minimum 1%)
        weights = np.clip(weights, 0.01, None)
        
    # Re-normalize weights so they sum to exactly 1.0 (100%)
    weights /= np.sum(weights)
    
    return {
        "weights": weights.tolist(),
        "means": means.tolist(),
        "covariances": user_gmm["covariances"]
    }
