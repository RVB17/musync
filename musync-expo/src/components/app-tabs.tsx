import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.text,
      }}>
      
      <Tabs.Screen 
        name="parties" 
        options={{ title: "Parties" }} 
      />

      <Tabs.Screen 
        name="groups" 
        options={{ title: "Groups" }} 
      />

      <Tabs.Screen 
        name="discover" 
        options={{ title: "Discover" }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ title: "Profile" }} 
      />

    </Tabs>
  );
}
