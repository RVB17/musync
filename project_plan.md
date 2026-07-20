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
- [x] **Task 1.1: Database Schema Overhaul**
  - **Goal**: Fix missing schema elements and secure RLS policies.
  - **Action**: 
    1. Add `spotify_refresh_token` to the `users` table. Create new tables `group_invites` and `party_invites` to replace the broken in-memory arrays.
    2. **Fix RLS Vulnerabilities**: 
       - Restrict public access to sensitive columns (like `spotify_refresh_token` and `email`) in the `users` table (e.g. by separating them or restricting select).
       - Ensure `UPDATE` policies for `parties` and `groups` only allow members/hosts to modify them, not just any authenticated user.
       - Ensure `SELECT` policies for `groups` only allow members to view them.
  - **Gate**: Supabase SQL script runs successfully; tables and columns exist in the database, and RLS policies are secure.
- [x] **Task 1.2: Fix Invites System**
  - **Goal**: Rewrite `backend/invites.js` to use Supabase.
  - **Action**: Implement POST and GET routes using the new invite tables. Update accept logic to add users to groups/parties in the database correctly.
  - **Gate**: Unit tests pass for sending, retrieving, and accepting invites.
- [x] **Task 1.3: Expose Collaborative Filtering (CF)**
  - **Goal**: Connect the frontend to the AI engine's CF matching.
  - **Action**: Add an Express route (`GET /api/recommend/similar-users`) that fetches the current user's GMM, fetches all other users' GMMs from Supabase, and calls `aiClient.getSimilarUsers()`.
  - **Gate**: API returns a sorted list of similar users given a valid JWT.

### Phase 2: Intelligent Candidate Generation
- [x] **Task 2.1: Spotify API Integration for Backend**
  - **Goal**: Allow backend to fetch data from Spotify on behalf of users.
  - **Action**: Implement helper functions to use a user's `spotify_refresh_token` to get an access token, then fetch their top artists and genres (including sub-genres).
  - **Gate**: Function successfully retrieves top genres for a mock user from Spotify.
- [x] **Task 2.1.5: Retrospective Validation of Completed Tasks**
  - **Goal**: Go back and write rigorous unit tests for Tasks 1.1, 1.2, 1.3, and 2.1.
  - **Action**: The previous tests were superficial. The Architect must now write actual, execution-based unit tests for the Supabase schema updates, the Invites routes, the CF endpoint, and the Spotify API functions. The Builder will implement any bug fixes discovered, and the Checker will verify them.
  - **Gate**: All comprehensive unit tests pass.
- [x] **Task 2.2: Compute Search Targets (Cluster Overlap & Discovery)**
  - **Goal**: Find GMM cluster sweet spots and ensure recommendations never run out.
  - **Action**: 
    - Calculate the mathematical average of overlapping clusters for the group (the "safe" zone).
    - **For Groups**: Apply a strict filter based on the *primary user's* GMM limits (e.g., if they hate acousticness, cap it), but intentionally inject a small % of "discovery" tracks that slightly exceed these limits to allow their profile to shift if they like them.
    - Output target feature ranges for both "Safe" and "Discovery" tracks.
  - **Gate**: Algorithm outputs correct target feature arrays given mock user GMMs.
- [x] **Task 2.3: Intelligent Recommendations Pipeline (Genres & Fallbacks)**
  - **Goal**: Connect target generation, Spotify Recommendations API, and AI scoring.
  - **Action**: 
    - Replace the concept of "Vibes" with a unified "Genres" system. 
    - When querying Spotify, fetch a mix of tracks using the "Safe" and "Discovery" targets.
    - Implement a graceful fallback: if 0 results, widen variance -> drop secondary features (acousticness/instrumentalness) -> keep core features (energy/danceability/valence) so the playlist never runs empty.
    - Score candidates via AI engine and return the ranked list.
  - **Gate**: Endpoint returns a continuous, mixed-variance list of tracks from Spotify that match the requested genre.

### Phase 3: Frontend Integration
- [x] **Task 3.1: Spotify OAuth & Login**
  - **Goal**: Replace dummy login with actual Spotify PKCE flow.
  - **Action**: Update `LoginScreen.tsx` to use `expo-auth-session`. Send the code to backend `/auth/spotify/exchange`. Store JWT.
  - **Gate**: User successfully logs in and JWT is stored in frontend state/storage.
- [x] **Task 3.2: Profile & Taste Building**
  - **Goal**: Allow users to build their taste profile.
  - **Action**: Update `ProfileScreen.tsx`. Fetch user's top tracks from Spotify via backend, then call `/users/build-taste` to train the GMM. Display success state.
  - **Gate**: User's GMM profile is populated in Supabase after clicking "Build Profile".
- [x] **Task 3.3: Groups, Parties & Invites UI**
  - **Goal**: Connect the social screens to the backend.
  - **Action**: Wire up `GroupsScreen`, `CreateGroupScreen`, and add a new `PartyScreen` and `InvitesScreen`.
  - **Gate**: User can create a group, invite a friend, and the friend can accept the invite via the UI.
- [x] **Task 3.4: Recommendations & Playback UI (Apple Music Style)**
  - **Goal**: Display recommended songs, dynamic genre chips, and allow playback.
  - **Action**: Add horizontal scrollable "Genre" chips (suggested from group's common genres). When clicked, display a preview modal of recommended songs with a "Shuffle" button. Connect `MusicPlayer.tsx` to play 30s previews using `expo-av`.
  - **Gate**: Genre chips populate correctly, preview modal opens, and track previews play successfully.

### Phase 4: Comprehensive End-to-End Validation
- [x] **Task 4.1: Backend Integration Suite**
  - **Goal**: Ensure the entire Node.js backend operates perfectly.
  - **Action**: Write Jest/Supertest suites to mock a Spotify OAuth flow, build a taste profile via the Python Engine, create a group, send/accept invites, and request a party recommendation.
  - **Gate**: 100% of critical API paths pass.
- [ ] **Task 4.2: Frontend E2E Suite**
  - **Goal**: Ensure the React Native UI flows flawlessly.
  - **Action**: Write UI tests using React Native Testing Library to simulate user taps from Login -> Profile -> Group Creation -> Playing a Recommendation.
  - **Gate**: All core user flows pass without crashes or hanging states.
- [ ] **Task 4.3: Full Stack Dry Run**
  - **Goal**: Final manual/automated verification.
  - **Action**: Boot the frontend, backend, and AI engine locally and run a complete simulated user session end-to-end.
  - **Gate**: The application behaves exactly as intended and is production-ready.
