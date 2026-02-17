import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { LogBox } from 'react-native';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { Colors } from '../src/constants/Colors';
import '../src/services/backgroundTask'; // Register background task definitions (renamed to .tsx for widget JSX)

// Suppress Expo Go notification warning/error since we use local notifications
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useCaffeineStore(state => state.theme);
  const colorScheme = Colors[theme];

  const CustomTheme = {
    ...(theme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colorScheme.background,
      card: colorScheme.card,
      text: colorScheme.text,
      primary: colorScheme.primary,
      border: colorScheme.border,
    },
  };

  const [loaded] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colorScheme.background }}>
      <ThemeProvider value={CustomTheme}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colorScheme.background },
            headerTintColor: colorScheme.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colorScheme.background },
            animation: 'slide_from_right',
            presentation: 'card', // Add this to ensure consistent card-style transitions if desired, or keep default
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-drink"
            options={{
              presentation: 'modal',
              title: 'Add Drink',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Settings',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="detailed-stats"
            options={{
              title: 'Detailed Statistics',
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
