import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'expo-router';
import { Pressable, Alert } from 'react-native';
import { ColorPalette } from '@/constants/designSystem';

export default function TabsLayout() {
  const { clearProfile } = useProfile();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: () => {
          clearProfile();
          router.replace('/(auth)/auth');
        }
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: ColorPalette.neutral.white },
        headerTitleStyle: { color: ColorPalette.primary.pink, fontWeight: '700' },
        headerRight: () => (
          <Pressable onPress={handleLogout} style={{ marginRight: 16 }}>
            <Ionicons name="log-out-outline" size={24} color={ColorPalette.neutral.gray500} />
          </Pressable>
        ),
        tabBarActiveTintColor: ColorPalette.primary.pink,
        tabBarInactiveTintColor: ColorPalette.neutral.gray500,
        tabBarStyle: {
          backgroundColor: ColorPalette.neutral.white,
          borderTopColor: ColorPalette.neutral.gray200,
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
