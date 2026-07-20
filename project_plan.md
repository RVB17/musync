# Musync Project Plan & Overhaul Strategy

## Overview
This document outlines the architecture, algorithmic needs, and task-by-task execution plan to complete Musync. The goal is to overhaul existing broken features, connect the ML microservice to the frontend via the Node.js backend, and implement new intelligent Spotify candidate generation.

## Architectural & Algorithmic Needs
1. **AI Engine (Python/FastAPI)**: Already implements GMM clustering, party overlap (threshold + misery), and CF (weighted cluster-pair similarity).
2. **Backend (Node.js/Express)**: Acts as the orchestrator. Must securely handle Spotify OAuth, proxy AI requests, and interact with Supabase. 
   - *Algorithmic Need*: Intelligent Candidate Generation. Instead of receiving random tracks, the backend must query Spotify's Recommendation API using genre seeds from users' top artists and target audio features derived from the users' GMM clusters' sweet spots. (If this approach needs revision, please review before we proceed).
3. **Database (Supabase)**: Stores users, parties, groups, and invites. Requires schema updates to support missing columns and new invite tables.
4. **Frontend (React Native/Expo)**: Needs to connect dummy UI to actual backend endpoints. Requires OAuth integration for Spotify.

## Task Breakdown

### Phase 1: Foundation & Backend Fixes
- [ ] **Task 1.1: Database Schema Overhaul**
  - **Goal**: Fix missing schema elements.
  - **Action**: Add `spotify_refresh_token` to the `users` table. Create new tables `group_invites` and `party_invites` to replace the broken in-memory arrays.
  - **Gate**: Supabase SQL script runs successfully; tables and columns exist in the database.
- [ ] **Task 1.2: Fix Invites System**
  - **Goal**: Rewrite `backend/invites.js` to use Supabase.
  - **Action**: Implement POST and GET routes using the new invite tables. Update accept logic to add users to groups/parties in the database correctly.
  - **Gate**: Unit tests pass for sending, retrieving, and accepting invites.
- [ ] **Task 1.3: Expose Collaborative Filtering (CF)**
  - **Goal**: Connect the frontend to the AI engine's CF matching.
  - **Action**: Add an Express route (`GET /api/recommend/similar-users`) that fetches the current user's GMM, fetches all other users' GMMs from Supabase, and calls `aiClient.getSimilarUsers()`.
  - **Gate**: API returns a sorted list of similar users given a valid JWT.

### Phase 2: Intelligent Candidate Generation
- [ ] **Task 2.1: Spotify API Integration for Backend**
  - **Goal**: Allow backend to fetch data from Spotify on behalf of users.
  - **Action**: Implement helper functions in backend to use a user's `spotify_refresh_token` to get an access token, then fetch their top artists and genres.
  - **Gate**: Function successfully retrieves top genres for a mock user from Spotify.
- [ ] **Task 2.2: Compute Search Targets (Cluster Overlap)**
  - **Goal**: Find GMM cluster sweet spots.
  - **Action**: Implement logic in backend to find overlapping clusters across multiple users in 5D space and calculate target audio features (danceability, energy, etc.).
  - **Gate**: Algorithm outputs correct target feature ranges given mock user GMMs.
- [ ] **Task 2.3: Intelligent Party Recommendations Pipeline**
  - **Goal**: Connect target generation, Spotify Recommendations API, and AI scoring.
  - **Action**: Update `POST /api/recommend/party` to: 1) Find sweet spots and genre seeds, 2) Fetch candidate tracks from Spotify, 3) Score them via AI engine, 4) Return ranked list.
  - **Gate**: Endpoint returns a ranked list of tracks from Spotify that match the group's taste.

### Phase 3: Frontend Integration
- [ ] **Task 3.1: Spotify OAuth & Login**
  - **Goal**: Replace dummy login with actual Spotify PKCE flow.
  - **Action**: Update `LoginScreen.tsx` to use `expo-auth-session`. Send the code to backend `/auth/spotify/exchange`. Store JWT.
  - **Gate**: User successfully logs in and JWT is stored in frontend state/storage.
- [ ] **Task 3.2: Profile & Taste Building**
  - **Goal**: Allow users to build their taste profile.
  - **Action**: Update `ProfileScreen.tsx`. Fetch user's top tracks from Spotify via backend, then call `/users/build-taste` to train the GMM. Display success state.
  - **Gate**: User's GMM profile is populated in Supabase after clicking "Build Profile".
- [ ] **Task 3.3: Groups, Parties & Invites UI**
  - **Goal**: Connect the social screens to the backend.
  - **Action**: Wire up `GroupsScreen`, `CreateGroupScreen`, and add a new `PartyScreen` and `InvitesScreen`.
  - **Gate**: User can create a group, invite a friend, and the friend can accept the invite via the UI.
- [ ] **Task 3.4: Recommendations & Playback**
  - **Goal**: Display recommended songs and allow playback.
  - **Action**: Add a "Get Recommendations" button to group/party screens. Render the returned tracks. Connect `MusicPlayer.tsx` to play 30s previews using `expo-av`.
  - **Gate**: Recommended tracks are displayed and their previews play successfully.
