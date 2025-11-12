import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function RegisterSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const username = params.username || '회원';

  const handleStart = () => {
    // 메인 화면으로 이동
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* 상단 여백 */}
      <View style={styles.topSpacer} />

      {/* 체크 아이콘 */}
      <View style={styles.iconContainer}>
        <MaterialIcons name="check-circle" size={82} color="#34C759" />
      </View>

      {/* 성공 메시지 */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>
          {username}님{'\n'}Traveline 가입이{'\n'}완료되었습니다.
        </Text>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Traveline 시작하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSpacer: {
    height: 88,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 190,
    marginBottom: 22,
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: 21,
  },
  message: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 32,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 50,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  startButton: {
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

