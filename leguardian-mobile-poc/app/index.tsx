import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth state to be loaded
    if (isLoading) {
      console.log('[Index] Still loading auth state...');
      return; // Still loading, do nothing
    }

    // Navigation after auth state is loaded
    if (isAuthenticated) {
      console.log('[Index] User is authenticated, redirecting to home');
      router.replace('/(tabs)');
    } else {
      console.log('[Index] User is NOT authenticated, redirecting to login');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
