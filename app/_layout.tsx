import React from 'react';
import { Stack } from 'expo-router';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { UserProvider } from '../src/context/UserContext';
import { Platform } from 'react-native';

export default function RootLayout() {
  return (
    <UserProvider>
      <PaperProvider theme={MD3LightTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              presentation: 'card',
              animation: 'default',
            }),
          }}
        >
          {/* Auth screens */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/email-login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register-success" options={{ headerShown: false }} />

          {/* Main screens */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="search"
            options={{
              presentation: Platform.OS === 'ios' ? 'card' : 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="new-schedule"
            options={{
              presentation: Platform.OS === 'ios' ? 'card' : 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="date-selection"
            options={{
              presentation: Platform.OS === 'ios' ? 'card' : 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="plan-detail"
            options={{
              presentation: Platform.OS === 'ios' ? 'card' : 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="add-place"
            options={{
              presentation: Platform.OS === 'ios' ? 'card' : 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="checklist"
            options={{
              presentation: Platform.OS === 'ios' ? 'card' : 'modal',
              headerShown: false,
            }}
          />
        </Stack>
      </PaperProvider>
    </UserProvider>
  );
}
