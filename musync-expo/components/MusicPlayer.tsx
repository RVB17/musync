import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

interface Track {
    id: string;
    name: string;
    artist?: string;
    previewUrl?: string;
}

interface MusicPlayerProps {
    previewUrl?: string;
    title?: string;
    currentTrack?: Track;
}

export default function MusicPlayer({ previewUrl, title, currentTrack }: MusicPlayerProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Support either old props or new currentTrack prop
    const actualPreviewUrl = currentTrack?.previewUrl || previewUrl || '';
    const actualTitle = currentTrack?.name || title || 'Unknown Track';
    const actualId = currentTrack?.id || 'unknown';

    const [votesCache, setVotesCache] = useState<{trackId: string, vote: number}[]>([]);

    async function playSound() {
        if (!actualPreviewUrl) return;
        const { sound } = await Audio.Sound.createAsync({ uri: actualPreviewUrl });
        setSound(sound);
        setIsPlaying(true);
        await sound.playAsync();
    }

    async function stopSound() {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
        }
    }

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    useEffect(() => {
        if (votesCache.length >= 5) {
            fetch('http://localhost:3001/api/users/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback: votesCache })
            }).catch(console.error);
            setVotesCache([]);
        }
    }, [votesCache]);

    function handleVote(vote: number) {
        setVotesCache(prev => [...prev, { trackId: actualId, vote }]);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Playing: {actualTitle}</Text>
            {isPlaying ? (
                <Button title="Stop" onPress={stopSound} />
            ) : (
                <Button title="Play Preview" onPress={playSound} />
            )}
            
            <View style={styles.voteContainer}>
                <Button title="Thumbs Up" onPress={() => handleVote(1)} />
                <Button title="Thumbs Down" onPress={() => handleVote(-1)} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginVertical: 10, padding: 10, borderWidth: 1, borderRadius: 8 },
    title: { fontSize: 16, marginBottom: 10 },
    voteContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }
});
