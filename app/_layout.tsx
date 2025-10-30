import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { RecipeProvider } from "@/contexts/recipe-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { router, useSegments } from "expo-router";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const colorScheme = useColorScheme();

  React.useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      // Rediriger vers login si non authentifié
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      // Rediriger vers l'app si authentifié
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RecipeProvider>
        <RootLayoutNav />
      </RecipeProvider>
    </AuthProvider>
  );
}
