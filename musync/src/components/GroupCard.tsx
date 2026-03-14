import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface GroupCardProps {
  groupName: string;
  members: string[];
  onJoin: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ groupName, members, onJoin }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.groupName}>{groupName}</Text>
      <Text style={styles.members}>Members: {members.join(', ')}</Text>
      <Button title="Join Group" onPress={onJoin} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  members: {
    marginVertical: 8,
  },
});

export default GroupCard;