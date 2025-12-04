import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { UserProvider } from '../src/context/UserContext';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // 앱이 이미 열려있을 때 딥링크 처리
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // 앱이 닫혀있을 때 딥링크로 열린 경우 처리 
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = ({ url }: { url: string }) => {
    console.log('Deep link received:', url);

    try {
      // traveline://invite/{token} 형식 파싱
      const parsed = Linking.parse(url);
      console.log('Parsed URL:', JSON.stringify(parsed, null, 2));

      if (parsed.scheme === 'traveline') {
        let token: string | null = null;

        // traveline://invite/{token} 형식 처리
        if (parsed.hostname === 'invite') {
          // path에서 토큰 추출: /f5fb7eba-a27c-415c-a8ff-e531121fbde2
          if (parsed.path) {
            token = parsed.path.replace(/^\//, '');
          }
          // queryParams에서 토큰 추출 (대체 방법)
          if (!token && parsed.queryParams?.token) {
            token = parsed.queryParams.token as string;
          }
        }

        // URL에서 직접 토큰 추출 (파싱 실패 시 대체 방법)
        if (!token) {
          const match = url.match(/traveline:\/\/invite\/([^/?]+)/);
          if (match && match[1]) {
            token = match[1];
          }
        }

        console.log('Extracted token:', token);

        if (token) {
          router.push({
            pathname: '/invite-accept',
            params: { token }
          });
        } else {
          console.warn('Token not found in URL:', url);
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

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
          <Stack.Screen
            name="invite-accept"
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
