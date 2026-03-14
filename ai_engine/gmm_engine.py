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
    The "Venn Diagram" method. A track must score decently across ALL user GMMs.
    Applies vector masks based on the target_vibe.
    """
    if not users or not candidate_tracks:
        return []
    
    # 1. Rebuild all User GMMs
    models = [rebuild_gmm(u) for u in users]
    
    X_candidates = extract_features(candidate_tracks)
    scores = []
    
    # 2. Score every candidate track
    for i, track_features in enumerate(X_candidates):
        raw_track = candidate_tracks[i] # Need the raw object for vibe attributes
        track_scores = []
        for gmm in models:
            # score_samples returns log-likelihood
            log_prob = gmm.score_samples([track_features])[0]
            
            # Since density can be > 1 in continuous space, we apply a sigmoid-like 
            # squeeze or just use the log_prob directly for ranking. 
            # To make it a "0 to 1" feel for the Venn diagram, we'll scale it.
            # A simple trick: e^(log_prob / D) where D is dimensions (5)
            prob = np.exp(log_prob / 5.0) 
            
            # Cap at 1.0 for sanity in the frontend
            prob_normalized = min(1.0, prob)
            track_scores.append(prob_normalized)
            
        # 3. Apply Vibe Modifier Mask
        vibe_multiplier = apply_vibe_penalty(raw_track, target_vibe)
            
        # 4. The Party Logic: Multiply the probabilities (Geometric mean approach).
        # If any user *hates* the track (prob near 0), the total score crashes to 0.
        party_score = np.prod(track_scores) * vibe_multiplier
        
        scores.append({
            "track_id": candidate_tracks[i].id,
            "party_score": float(party_score),
            "individual_scores": [float(s) for s in track_scores],
            "vibe_multiplier": float(vibe_multiplier)
        })
        
    # Sort by the highest party overlap score
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

def get_gmm_centroid(params: Dict[str, Any]) -> np.ndarray:
    """Calculates the weighted center of all clusters to find the 'Absolute Average' vibe."""
    weights = np.array(params["weights"])
    means = np.array(params["means"])
    return np.average(means, axis=0, weights=weights)

def compute_cf_distance(target_gmm: Dict[str, Any], global_gmms: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Finds the mathematically nearest users by comparing the geometric centroids of their GMMs.
    Returns a sorted list of users (closest first).
    """
    if "weights" not in target_gmm:
        return []

    target_centroid = get_gmm_centroid(target_gmm)
    results = []
    
    for global_id, gmm_params in global_gmms.items():
        if not gmm_params or "means" not in gmm_params:
            continue
            
        global_centroid = get_gmm_centroid(gmm_params)
        
        # Euclidean distance in 5D space
        dist = np.linalg.norm(target_centroid - global_centroid)
        
        # Convert Euclidean distance to a 0.0 to 1.0 similarity score
        # 0 distance = 1.0 similarity
        similarity = 1.0 / (1.0 + float(dist))
        
        results.append({
            "user_id": global_id,
            "similarity": similarity
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
