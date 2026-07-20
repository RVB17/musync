from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from gmm_engine import fit_user_gmm, compute_party_overlap, compute_group_recommendation, compute_cf_distance, apply_feedback

app = FastAPI(title="Musync AI Engine", description="GMM-based Music Recommendation Microservice")

# --- Data Models ---
class TrackFeatures(BaseModel):
    id: str
    danceability: float
    energy: float
    valence: float
    acousticness: float
    instrumentalness: float

class UserProfileRequest(BaseModel):
    user_id: str
    tracks: List[TrackFeatures]

class PartyRequest(BaseModel):
    users: List[Dict[str, Any]] # List of user GMM parameters
    candidate_tracks: List[TrackFeatures]
    target_vibe: str = "Any" # E.g., Chill, Energetic, Acoustic

class GroupRequest(BaseModel):
    primary_user: Dict[str, Any]
    secondary_users: List[Dict[str, Any]]
    candidate_tracks: List[TrackFeatures]

class FeedbackRequest(BaseModel):
    user_gmm: Dict[str, Any]
    track_features: TrackFeatures
    action: str # "like" or "skip"

class BatchedFeedbackItem(BaseModel):
    track_features: TrackFeatures
    vote: int

class BatchedFeedbackRequest(BaseModel):
    user_gmm: Dict[str, Any]
    feedbacks: List[BatchedFeedbackItem]

class CFRequest(BaseModel):
    target_gmm: Dict[str, Any]
    global_gmms: Dict[str, Dict[str, Any]] # Map of user_id -> GMM parameters

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Musync AI Engine is running locally on port 8000"}

@app.post("/build_profile")
def build_profile(request: UserProfileRequest):
    """
    Takes a user's top tracks and fits a Gaussian Mixture Model to find their taste clusters.
    """
    if len(request.tracks) < 5:
         raise HTTPException(status_code=400, detail="Need at least 5 tracks to build a meaningful profile.")
    
    gmm_params = fit_user_gmm(request.tracks)
    return {"user_id": request.user_id, "model": gmm_params}

@app.post("/party/recommend")
def party_recommend(request: PartyRequest):
    """
    Calculates the Venn diagram overlap of multiple GMMs to find a track that appeals to the whole room.
    Applies vector masks based on the target_vibe.
    """
    best_tracks = compute_party_overlap(request.users, request.candidate_tracks, request.target_vibe)
    return {"recommendations": best_tracks}

@app.post("/group/recommend")
def group_recommend(request: GroupRequest):
    """
    Recommends a track primarily for the primary_user, but applies a penalty if the secondary_users hate it.
    """
    best_tracks = compute_group_recommendation(request.primary_user, request.secondary_users, request.candidate_tracks)
    return {"recommendations": best_tracks}

@app.post("/feedback")
def update_profile_feedback(request: FeedbackRequest):
    """
    Dynamically shifts the GMM cluster weights/means based on a 'like' or 'skip'.
    """
    updated_gmm = apply_feedback(request.user_gmm, request.track_features, request.action)
    return {"updated_gmm": updated_gmm}

@app.post("/update-taste")
def update_taste_batched(request: BatchedFeedbackRequest):
    """
    Updates the user's taste profile mathematically from batched votes.
    """
    current_gmm = request.user_gmm
    for fb in request.feedbacks:
        action = "like" if fb.vote > 0 else "skip"
        current_gmm = apply_feedback(current_gmm, fb.track_features, action)
    return {"updated_gmm": current_gmm}

@app.post("/cf/match")
def cf_match(request: CFRequest):
    """
    Finds the closest "Global Users" whose GMM matches the target_gmm.
    Returns a sorted list of user_ids and their distance scores.
    """
    matches = compute_cf_distance(request.target_gmm, request.global_gmms)
    return {"matches": matches}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
