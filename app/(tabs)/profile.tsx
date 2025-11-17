import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../../src/context/UserContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { authUser, isAuthenticated, logout } = useUser();

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('오류', '로그아웃에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>프로필</Text>
      </View>

      <View style={styles.content}>
        {isAuthenticated && authUser ? (
          <>
            {/* 프로필 정보 */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <MaterialIcons name="person" size={60} color="#007AFF" />
              </View>
              <Text style={styles.nickname}>{authUser.username}</Text>
              <Text style={styles.email}>{authUser.email}</Text>
            </View>

            {/* 로그아웃 버튼 */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#FF3B30" />
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* 게스트 모드 */}
            <View style={styles.guestCard}>
              <MaterialIcons name="person-outline" size={60} color="#999" />
              <Text style={styles.guestText}>게스트 모드</Text>
              <Text style={styles.guestSubtext}>로그인하여 더 많은 기능을 이용하세요</Text>
            </View>

            {/* 로그인 버튼 */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nickname: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  guestSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
