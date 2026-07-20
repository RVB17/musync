import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import * as AuthSession from 'expo-auth-session';

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function ProfileScreen() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
      {
        clientId: 'dummy-client-id',
        scopes: ['user-read-email'],
        usePKCE: true,
        redirectUri: 'exp://localhost:19000/--/redirect',
      },
      discovery
    );

    useEffect(() => {
      if (response?.type === 'success') {
        const { code } = response.params;
        
        setLoading(true);
        
        fetch('http://localhost:3001/auth/spotify/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            redirectUri: 'exp://localhost:19000/--/redirect',
            codeVerifier: request?.codeVerifier
          })
        })
        .then(res => res.json())
        .then(data => {
          setMessage('Spotify Connected Successfully!');
          setLoading(false);
        })
        .catch(err => {
          console.error("Exchange error", err);
          setMessage('Failed to connect Spotify');
          setLoading(false);
        });
      }
    }, [response]);

    const handleBuildProfile = async () => {
        setLoading(true);
        setMessage('');
        try {
            const jwt = 'dummy-jwt-token';
            
            // 1. Fetch top tracks
            const topTracksRes = await fetch('http://localhost:3001/api/users/top-tracks', {
                headers: { 'Authorization': `Bearer ${jwt}` }
            });
            const tracks = await topTracksRes.json();
            
            if (!topTracksRes.ok) throw new Error(tracks.error || 'Failed to fetch tracks');

            // 2. Build taste profile
            const buildRes = await fetch('http://localhost:3001/api/users/build-taste', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({ tracks })
            });
            const buildData = await buildRes.json();
            
            if (!buildRes.ok) throw new Error(buildData.error || 'Failed to build taste');

            setMessage('Success! Taste profile trained successfully.');
        } catch (error: any) {
            setMessage(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Profile</Text>
            
            {loading ? (
                <ActivityIndicator size="large" />
            ) : (
                <View style={styles.buttonContainer}>
                    <Button 
                        disabled={!request}
                        title="Connect Spotify" 
                        onPress={() => promptAsync()} 
                    />
                    <View style={{ height: 10 }} />
                    <Button title="Build Profile" onPress={handleBuildProfile} />
                </View>
            )}
            
            {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    title: {
        fontSize: 24,
        marginBottom: 20
    },
    message: {
        marginTop: 20,
        fontSize: 16,
        color: 'green'
    },
    buttonContainer: {
        width: '100%'
    }
});
