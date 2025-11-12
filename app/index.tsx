import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../src/utils/authApi';

export default function IndexScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 토큰 초기화
      await authApi.initializeTokens();
      
      // 로그인 상태 확인
      const isAuthenticated = authApi.isAuthenticated();
      
      if (isAuthenticated) {
        // 로그인 상태이면 메인 화면으로
        router.replace('/(tabs)');
      } else {
        // 로그인 안 되어 있으면 로그인 화면으로
        router.replace('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // 에러 발생 시 로그인 화면으로
      router.replace('/login');
    } finally {
      setIsChecking(false);
    }
  };

  // 로딩 화면
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

