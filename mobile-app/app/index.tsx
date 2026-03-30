import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to auth flow - user can choose User or Admin login
  return <Redirect href="/(auth)" />;
}

