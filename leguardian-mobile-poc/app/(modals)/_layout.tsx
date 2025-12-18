import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="settings" />
    </Stack>
  );
}
