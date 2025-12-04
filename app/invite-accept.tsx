import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { travelPlanApi } from '../src/utils/travelPlanApi';
import type { TravelPlanDto } from '../src/utils/travelPlanApi';
import { useUser } from '../src/context/UserContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InviteAcceptScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const insets = useSafeAreaInsets();
    const { authUser } = useUser();
    const [inviteInfo, setInviteInfo] = useState<TravelPlanDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);

    useEffect(() => {
        if (token) {
            loadInviteInfo();
        }
    }, [token]);

    const loadInviteInfo = async () => {
        if (!token) return;

        try {
            setIsLoading(true);
            const info = await travelPlanApi.getInviteInfo(token);
            setInviteInfo(info);
        } catch (error: any) {
            console.error('Failed to load invite info:', error);
            Alert.alert(
                '오류',
                error.message || '초대 정보를 불러올 수 없습니다.',
                [
                    {
                        text: '확인',
                        onPress: () => router.back(),
                    },
                ]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!token || !authUser) {
            Alert.alert('오류', '로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        try {
            setIsAccepting(true);
            await travelPlanApi.acceptInviteByLink(token);
            
            Alert.alert(
                '초대 수락 완료',
                '여행 계획에 참여되었습니다.',
                [
                    {
                        text: '확인',
                        onPress: () => {
                            if (inviteInfo) {
                                router.replace({
                                    pathname: '/plan-detail',
                                    params: { planId: inviteInfo.id.toString() },
                                });
                            } else {
                                router.replace('/(tabs)');
                            }
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('Failed to accept invite:', error);
            Alert.alert('오류', error.message || '초대 수락에 실패했습니다.');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleReject = () => {
        Alert.alert(
            '초대 거절',
            '이 초대를 거절하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '거절',
                    style: 'destructive',
                    onPress: () => {
                        router.back();
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>초대 수락</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#088CDA" />
                    <Text style={styles.loadingText}>초대 정보를 불러오는 중...</Text>
                </View>
            </View>
        );
    }

    if (!inviteInfo) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>초대 수락</Text>
                </View>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color="#9E9E9E" />
                    <Text style={styles.errorText}>초대 정보를 불러올 수 없습니다.</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadInviteInfo}
                    >
                        <Text style={styles.retryButtonText}>다시 시도</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>초대 수락</Text>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.inviteCard}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="flight" size={48} color="#088CDA" />
                    </View>
                    <Text style={styles.inviteTitle}>여행 초대</Text>
                    <Text style={styles.inviteDescription}>
                        여행 계획에 초대되었습니다.
                    </Text>
                </View>

                <View style={styles.planInfoCard}>
                    <Text style={styles.planInfoLabel}>여행 계획</Text>
                    <Text style={styles.planInfoTitle}>{inviteInfo.title}</Text>
                    
                    <View style={styles.planInfoRow}>
                        <MaterialIcons name="location-on" size={20} color="#585858" />
                        <Text style={styles.planInfoText}>
                            {inviteInfo.destination.name}
                        </Text>
                    </View>

                    <View style={styles.planInfoRow}>
                        <MaterialIcons name="calendar-today" size={20} color="#585858" />
                        <Text style={styles.planInfoText}>
                            {inviteInfo.startDate} ~ {inviteInfo.endDate}
                        </Text>
                    </View>

                    <View style={styles.planInfoRow}>
                        <MaterialIcons name="people" size={20} color="#585858" />
                        <Text style={styles.planInfoText}>
                            참여자 {inviteInfo.participants}명
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={[styles.acceptButton, isAccepting && styles.buttonDisabled]}
                    onPress={handleAccept}
                    disabled={isAccepting || !authUser}
                >
                    {isAccepting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons name="check-circle" size={24} color="#fff" />
                            <Text style={styles.acceptButtonText}>초대 수락</Text>
                        </>
                    )}
                </TouchableOpacity>

                {!authUser && (
                    <Text style={styles.loginHint}>
                        초대를 수락하려면 로그인이 필요합니다.
                    </Text>
                )}

                <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={handleReject}
                    disabled={isAccepting}
                >
                    <Text style={styles.rejectButtonText}>거절</Text>
                </TouchableOpacity>
            </View>
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
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
    },
    backButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        color: '#9E9E9E',
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    errorText: {
        fontSize: 16,
        color: '#9E9E9E',
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    inviteCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    inviteTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    inviteDescription: {
        fontSize: 14,
        color: '#585858',
        textAlign: 'center',
    },
    planInfoCard: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 20,
    },
    planInfoLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#9E9E9E',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    planInfoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
    },
    planInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    planInfoText: {
        fontSize: 14,
        color: '#585858',
        marginLeft: 8,
    },
    bottomSection: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    acceptButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        marginBottom: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.2,
        color: '#fff',
    },
    loginHint: {
        fontSize: 12,
        color: '#9E9E9E',
        textAlign: 'center',
        marginBottom: 12,
    },
    rejectButton: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    rejectButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#9E9E9E',
    },
});

