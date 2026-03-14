import React from 'react';
import { Button } from 'react-native';

interface AuthButtonProps {
  onPress: () => void;
  platform: 'Spotify' | 'Apple Music';
}

const AuthButton: React.FC<AuthButtonProps> = ({ onPress, platform }) => {
  return (
    <Button
      title={`Sign in with ${platform}`}
      onPress={onPress}
    />
  );
};

export default AuthButton;