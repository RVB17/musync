import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

interface MusicPlayerProps {
    previewUrl: string;
    title: string;
}

export default function MusicPlayer({ previewUrl, title }: MusicPlayerProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    async function playSound() {
        if (!previewUrl) return;
        const { sound } = await Audio.Sound.createAsync({ uri: previewUrl });
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Playing: {title}</Text>
            {isPlaying ? (
                <Button title="Stop" onPress={stopSound} />
            ) : (
                <Button title="Play Preview" onPress={playSound} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginVertical: 10, padding: 10, borderWidth: 1, borderRadius: 8 },
    title: { fontSize: 16, marginBottom: 10 }
});
