import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = () => {
    router.push('/auth/register');
  };

  const handleLogin = () => {
    router.push('/auth/email-login');
  };

  const handleGuestLogin = () => {
    // 게스트 로그인 - 메인 화면으로 이동
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 타이틀 */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Traveline</Text>
        </View>

        {/* 서브타이틀 */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>3초만에 빠른 회원가입 ⚡</Text>
        </View>

        {/* 로그인 버튼 영역 */}
        <View style={styles.loginContainer}>
          {/* 이메일로 시작하기 버튼 */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailSignup}
            disabled={loading}
          >
            <MaterialIcons name="email" size={24} color="#333" style={styles.buttonIcon} />
            <Text style={styles.emailButtonText}>이메일로 시작하기</Text>
          </TouchableOpacity>
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 게스트 로그인 버튼 */}
        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestLogin}
          disabled={loading}
        >
          <MaterialIcons name="person-outline" size={24} color="#666" style={styles.buttonIcon} />
          <Text style={styles.guestButtonText}>게스트로 시작하기</Text>
        </TouchableOpacity>

        {/* 로그인 링크 */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>이미 계정이 있으신가요? </Text>
          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>
        </View>

        {/* 로딩 오버레이 */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 181,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 84,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  loginContainer: {
    marginBottom: 24,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonIcon: {
    marginRight: 12,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

