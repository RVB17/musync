import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AuthButton from '../components/AuthButton';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen = ({ navigation }: Props) => {
  const handleLogin = (platform: string) => {
    // Handle authentication logic here
    // After successful login, navigate to ProfileScreen
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to Your Music Profile</Text>
      <AuthButton onPress={() => handleLogin('Spotify')} platform="Spotify" />
      <AuthButton onPress={() => handleLogin('Apple Music')} platform="Apple Music" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default LoginScreen;