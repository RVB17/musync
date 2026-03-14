import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { getGroupsByLocation } from '../services/locationService';
import GroupCard from '../components/GroupCard';

interface Group {
  id: number;
  name: string;
  members: string[];
}

const GroupsScreen = ({ navigation }: { navigation: any }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const fetchedGroups = await getGroupsByLocation();
        setGroups(fetchedGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const renderGroup = ({ item }: { item: Group }) => (
    <GroupCard
      groupName={item.name}
      members={item.members}
      onJoin={() => handleJoinGroup(item.id)}
    />
  );

  const handleJoinGroup = (groupId: number) => {
    // Logic to join the group
    console.log(`Joining group with ID: ${groupId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Music Groups</Text>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id.toString()}
      />
      <Button title="Create New Group" onPress={() => navigation.navigate('CreateGroup')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GroupsScreen;