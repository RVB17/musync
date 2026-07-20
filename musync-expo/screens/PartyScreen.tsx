import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import MusicPlayer from '../components/MusicPlayer';

const GENRES = ['Pop', 'Rock', 'Hip Hop', 'Jazz', 'Electronic'];

export default function PartyScreen() {
    const [selectedGenre, setSelectedGenre] = useState('');
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSelectGenre = async (genre: string) => {
        setSelectedGenre(genre);
        setLoading(true);
        try {
            const jwt = 'dummy-jwt-token';
            const res = await fetch('http://localhost:3001/api/recommend/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({ genre })
            });
            const data = await res.json();
            setRecommendations(data.tracks || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Party Mode</Text>
            <ScrollView horizontal style={styles.chipsContainer}>
                {GENRES.map(genre => (
                    <TouchableOpacity
                        key={genre}
                        testID={`genre-chip-${genre}`}
                        style={[styles.chip, selectedGenre === genre && styles.chipSelected]}
                        onPress={() => handleSelectGenre(genre)}
                    >
                        <Text style={styles.chipText}>{genre}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading && <ActivityIndicator size="large" />}

            <ScrollView style={styles.list}>
                {recommendations.map((track, i) => (
                    <View key={i} style={styles.trackCard}>
                        <Text style={styles.trackTitle}>{track.name}</Text>
                        <MusicPlayer previewUrl={track.preview_url} title={track.name} />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, marginBottom: 20 },
    chipsContainer: { maxHeight: 50, marginBottom: 20 },
    chip: { padding: 10, backgroundColor: '#eee', borderRadius: 20, marginRight: 10 },
    chipSelected: { backgroundColor: '#add8e6' },
    chipText: { fontSize: 16 },
    list: { flex: 1 },
    trackCard: { marginBottom: 15, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
    trackTitle: { fontSize: 18, fontWeight: 'bold' }
});
