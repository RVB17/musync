import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { Audio } from 'expo-av';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const MusicPlayer: React.FC = () => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const currentTrack = useSelector((state: RootState) => state.music.currentTrack);

    useEffect(() => {
        return sound ? () => {
            sound.unloadAsync();
        } : undefined;
    }, [sound]);

    const playSound = async () => {
        if (sound) {
            await sound.playAsync();
            setIsPlaying(true);
        } else {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: currentTrack.uri }
            );
            setSound(newSound);
            await newSound.playAsync();
            setIsPlaying(true);
        }
    };

    const pauseSound = async () => {
        if (sound) {
            await sound.pauseAsync();
            setIsPlaying(false);
        }
    };

    const skipTrack = async () => {
        // Logic to skip to the next track
    };

    return (
        <View>
            <Text>Now Playing: {currentTrack.title}</Text>
            <Button title={isPlaying ? "Pause" : "Play"} onPress={isPlaying ? pauseSound : playSound} />
            <Button title="Skip" onPress={skipTrack} />
        </View>
    );
};

export default MusicPlayer;