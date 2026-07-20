-- Run this in your Supabase SQL Editor
-- Create the Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    friends UUID[] DEFAULT '{}',
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    gmm_profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE public.user_private (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    spotify_refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create the Parties table (Transient, location-based, host controls playback)
CREATE TABLE public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    vibe TEXT DEFAULT 'Any',
    members UUID[] DEFAULT '{}',
    location JSONB DEFAULT '{"lat": 0, "lng": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create the Groups table (Persistent, shared playlists, anyone can play anywhere)
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    members UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- +---------------------------------------------------------------+
-- | RLS POLICIES FOR USERS TABLE                                  |
-- +---------------------------------------------------------------+

-- 1. Allow public reads (so people can search for friends/usernames)
CREATE POLICY "Allow public read access to users"
ON public.users
FOR SELECT
USING (true);

-- +---------------------------------------------------------------+
-- | RLS POLICIES FOR USER_PRIVATE TABLE                           |
-- +---------------------------------------------------------------+

CREATE POLICY "Allow users to read own private data"
ON public.user_private
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own private data"
ON public.user_private
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update own private data"
ON public.user_private
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Allow users to insert their *own* profile upon signing up
CREATE POLICY "Allow users to create their own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Allow users to update ONLY their own profile (bio, friends list, GMM profile)
CREATE POLICY "Allow users to update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- +---------------------------------------------------------------+
-- | RLS POLICIES FOR PARTIES TABLE                                |
-- +---------------------------------------------------------------+

-- 1. Allow any logged-in user to view active parties
CREATE POLICY "Allow authenticated readers to view parties"
ON public.parties
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. Allow any logged-in user to create a new party
CREATE POLICY "Allow authenticated users to create parties"
ON public.parties
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow members to update a party
CREATE POLICY "Allow members to update party"
ON public.parties
FOR UPDATE
USING (auth.uid() = ANY(members))
WITH CHECK (auth.uid() = ANY(members));

-- +---------------------------------------------------------------+
-- | RLS POLICIES FOR GROUPS TABLE                                 |
-- +---------------------------------------------------------------+

CREATE POLICY "Allow members to select their groups"
ON public.groups
FOR SELECT
USING (auth.uid() = ANY(members));

CREATE POLICY "Allow authenticated users to create groups"
ON public.groups
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow members to update groups"
ON public.groups
FOR UPDATE
USING (auth.uid() = ANY(members))
WITH CHECK (auth.uid() = ANY(members));

-- +---------------------------------------------------------------+
-- | GROUP AND PARTY INVITES TABLES                                |
-- +---------------------------------------------------------------+

-- Create the Group Invites table
CREATE TABLE public.group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create the Party Invites table
CREATE TABLE public.party_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for Group and Party Invites
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_invites ENABLE ROW LEVEL SECURITY;

-- +---------------------------------------------------------------+
-- | RLS POLICIES FOR GROUP INVITES TABLE                          |
-- +---------------------------------------------------------------+

CREATE POLICY "Allow users to view their group invites"
ON public.group_invites
FOR SELECT
USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Allow users to insert group invites"
ON public.group_invites
FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Allow invitees to update their group invites"
ON public.group_invites
FOR UPDATE
USING (auth.uid() = invitee_id)
WITH CHECK (auth.uid() = invitee_id);

-- +---------------------------------------------------------------+
-- | RLS POLICIES FOR PARTY INVITES TABLE                          |
-- +---------------------------------------------------------------+

CREATE POLICY "Allow users to view their party invites"
ON public.party_invites
FOR SELECT
USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Allow users to insert party invites"
ON public.party_invites
FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Allow invitees to update their party invites"
ON public.party_invites
FOR UPDATE
USING (auth.uid() = invitee_id)
WITH CHECK (auth.uid() = invitee_id);
