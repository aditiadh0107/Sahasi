import { Redirect } from 'expo-router'
import { useProfile } from '@/contexts/ProfileContext'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { profile, sessionLoaded } = useProfile()

  // wait for AsyncStorage to load before deciding where to go
  if (!sessionLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF1493" />
      </View>
    )
  }

  // if we have a saved session (user_id present), go straight to app
  if (profile?.id) {
    return <Redirect href="/(tabs)/workout" />
  }

  return <Redirect href="/(auth)/auth" />
}
