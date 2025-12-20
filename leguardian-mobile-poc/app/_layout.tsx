import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { configureEcho } from "@laravel/echo-react";
import { ThemeProvider } from "../contexts/ThemeContext";
import { I18nProvider } from "../contexts/I18nContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { WebSocketProvider } from "../contexts/WebSocketContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { SafetyZonesProvider } from "../contexts/SafetyZonesContext";

// Configure Echo with manual config (avoid import.meta for Hermes compatibility)
configureEcho({
  broadcaster: "reverb",
  key: process.env.EXPO_PUBLIC_REVERB_APP_KEY,
  wsHost: process.env.EXPO_PUBLIC_REVERB_HOST,
  wsPort: parseInt(process.env.EXPO_PUBLIC_REVERB_PORT || "443"),
  wssPort: parseInt(process.env.EXPO_PUBLIC_REVERB_PORT || "443"),
  forceTLS: process.env.EXPO_PUBLIC_REVERB_SCHEME === "https",
  enabledTransports: ["ws", "wss"],
});

// Inner component that has access to useAuth
function RootLayoutContent() {
  const { isAuthenticated } = useAuth();

  return (
    <SafetyZonesProvider>
      <WebSocketProvider isAuthenticated={isAuthenticated}>
        <NotificationProvider isAuthenticated={isAuthenticated}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="notification-map" />
            <Stack.Screen name="change-password" />
          </Stack>
        </NotificationProvider>
      </WebSocketProvider>
    </SafetyZonesProvider>
  );
}

export default function RootLayout() {
  console.log("Prout");

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <RootLayoutContent />
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
