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

-- Note: We are mocking password_hash here for simplicity, 
-- ideally you'd use Supabase's built-in Auth, but we'll adapt 
-- the current custom users.js logic to Postgres first to save time!
