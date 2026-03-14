-- Run this in your Supabase SQL Editor
-- Create the Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    friends UUID[] DEFAULT '{}',
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    gmm_profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create the Parties table
CREATE TABLE public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    vibe TEXT DEFAULT 'Any',
    members UUID[] DEFAULT '{}',
    location JSONB DEFAULT '{"lat": 0, "lng": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

-- +---------------------------------------------------------------+
-- | RLS POLICIES FOR USERS TABLE                                  |
-- +---------------------------------------------------------------+

-- 1. Allow public reads (so people can search for friends/usernames)
CREATE POLICY "Allow public read access to users"
ON public.users
FOR SELECT
USING (true);

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

-- 3. Allow any logged-in user to update a party (to join/leave)
CREATE POLICY "Allow authenticated users to join/leave"
ON public.parties
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
