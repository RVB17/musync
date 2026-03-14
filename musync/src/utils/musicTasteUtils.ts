export const mixTastes = (userTastes: string[], groupTastes: string[]): string[] => {
    const mixedTastes = [...new Set([...userTastes, ...groupTastes])];
    return mixedTastes;
};

export const suggestMusicByMood = (mood: string, musicData: any[]): any[] => {
    return musicData.filter(song => song.mood === mood);
};

export const analyzeListeningData = (listeningData: any[]): { [key: string]: number } => {
    const tasteProfile: { [key: string]: number } = {};
    listeningData.forEach(song => {
        tasteProfile[song.genre] = (tasteProfile[song.genre] || 0) + 1;
    });
    return tasteProfile;
};