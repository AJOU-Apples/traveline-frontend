import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatRoom from '../components/ChatRoom';
import { useUser } from '../src/context/UserContext';

export default function ChatScreen() {
    const { planId } = useLocalSearchParams<{ planId: string }>();
    const insets = useSafeAreaInsets();
    const { authUser, getTravelPlan } = useUser();

    const travelPlan = planId ? getTravelPlan(planId) : undefined;
    const title = travelPlan?.title || '';
    const participants = travelPlan?.participants || 0;

    if (!planId) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Feather name="x" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>여행 계획 정보가 없습니다</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{title} </Text>
                    <Text style={styles.headerParticipants}>{participants}명</Text>
                </View>
                <View style={styles.headerRight} />
            </View>
            <ChatRoom
                travelPlanId={planId}
                currentUserId={authUser?.id}
                enabled={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
    },
    closeButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    headerParticipants: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    headerRight: {
        width: 24,
        height: 24,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#9E9E9E',
    },
});

