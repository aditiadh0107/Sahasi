import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { T } from '@/constants/theme';

export default function TabsLayout() {
  const { clearProfile } = useProfile();
  const router = useRouter();

  const handleLogout = () => {
    clearProfile();
    router.push('/(auth)/auth');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.muted,
        tabBarStyle: {
          backgroundColor: T.white,
          borderTopColor: T.border,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Training',
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: 'Zones',
          tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, size }) => <Ionicons name="alert-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage-people"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="incident"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="legal-chatbot"
        options={{
          title: 'Legal',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="therapist"
        options={{
          title: 'Support',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
