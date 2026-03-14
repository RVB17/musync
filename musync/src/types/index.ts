export interface User {
    id: string;
    name: string;
    email: string;
    spotifyId?: string;
    appleMusicId?: string;
    musicTasteProfile: MusicTaste;
}

export interface Group {
    id: string;
    name: string;
    members: User[];
    mood: string;
    location: string;
}

export interface MusicTaste {
    genres: string[];
    artists: string[];
    songs: string[];
}

export interface Location {
    latitude: number;
    longitude: number;
}

export interface RootState {
    user: User | null;
    music: {
        currentTrack: any;
        isPlaying: boolean;
    };
    // Add other state slices as needed
}