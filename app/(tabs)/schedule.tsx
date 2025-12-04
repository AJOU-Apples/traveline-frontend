import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Modal,
    Pressable,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import { travelPlanApi } from '../../src/utils/travelPlanApi';

export default function ScheduleScreen() {
    const insets = useSafeAreaInsets();
    const { username, isAuthenticated, travelPlans, loadTravelPlans, isLoadingPlans, deleteTravelPlan } = useUser();
    const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
    const [refreshing, setRefreshing] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [showMoreModal, setShowMoreModal] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

    // 현재 날짜 기준으로 다가오는 여행과 지난 여행 분류
    const { upcomingTrips, pastTrips } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = travelPlans.filter(plan => {
            const endDate = new Date(plan.endDate.replace(/\./g, '-'));
            return endDate >= today;
        }).sort((a, b) => {
            const dateA = new Date(a.startDate.replace(/\./g, '-'));
            const dateB = new Date(b.startDate.replace(/\./g, '-'));
            return dateA.getTime() - dateB.getTime();
        });

        const past = travelPlans.filter(plan => {
            const endDate = new Date(plan.endDate.replace(/\./g, '-'));
            return endDate < today;
        }).sort((a, b) => {
            const dateA = new Date(a.startDate.replace(/\./g, '-'));
            const dateB = new Date(b.startDate.replace(/\./g, '-'));
            return dateB.getTime() - dateA.getTime(); // 최신순
        });

        return { upcomingTrips: upcoming, pastTrips: past };
    }, [travelPlans]);

    const displayedTrips = selectedTab === 'upcoming' ? upcomingTrips : pastTrips;

    // 화면이 포커스될 때마다 여행 계획 불러오기
    useFocusEffect(
        React.useCallback(() => {
            if (isAuthenticated) {
                loadTravelPlans();
            }
        }, [isAuthenticated, loadTravelPlans])
    );

    // 새로고침 처리
    const handleRefresh = async () => {
        if (!isAuthenticated) return;

        setRefreshing(true);
        try {
            await loadTravelPlans();
        } catch (error) {
            console.error('Failed to refresh travel plans:', error);
            Alert.alert('오류', '여행 계획을 불러오는데 실패했습니다.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleTripPress = (planId: string) => {
        router.push({
            pathname: '/plan-detail',
            params: { planId }
        });
    };

    const handleNewSchedule = () => {
        if (!isAuthenticated) {
            Alert.alert(
                '로그인이 필요합니다',
                '새 일정 추가는 로그인 후 이용 가능한 기능입니다.\n지금 가입하시겠습니까?',
                [
                    {
                        text: '취소',
                        style: 'cancel',
                    },
                    {
                        text: '회원가입',
                        onPress: () => router.push('/auth/register'),
                    },
                    {
                        text: '로그인',
                        onPress: () => router.push('/login'),
                    },
                ]
            );
            return;
        }
        router.push('/new-schedule');
    };

    const handleSubmitInviteCode = async () => {
        // 에러 메시지 초기화
        setInviteError(null);

        if (!inviteCode.trim()) {
            setInviteError('초대 코드를 입력해주세요.');
            return;
        }

        if (!isAuthenticated) {
            Alert.alert(
                '로그인이 필요합니다',
                '초대 코드를 사용하려면 로그인이 필요합니다.',
                [
                    {
                        text: '취소',
                        style: 'cancel',
                    },
                    {
                        text: '로그인',
                        onPress: () => {
                            setShowInviteModal(false);
                            router.push('/login');
                        },
                    },
                ]
            );
            return;
        }

        try {
            setIsSubmittingCode(true);
            // 먼저 초대 정보 조회
            const inviteInfo = await travelPlanApi.getInviteInfoByCode(inviteCode.trim());

            // 초대 수락 확인
            Alert.alert(
                '초대 수락',
                `${inviteInfo.title} 여행에 참여하시겠습니까?`,
                [
                    {
                        text: '취소',
                        style: 'cancel',
                        onPress: () => setIsSubmittingCode(false),
                    },
                    {
                        text: '수락',
                        onPress: async () => {
                            try {
                                await travelPlanApi.acceptInviteByCode(inviteCode.trim());
                                Alert.alert('성공', '여행 계획에 참여되었습니다.', [
                                    {
                                        text: '확인',
                                        onPress: () => {
                                            setInviteCode('');
                                            setInviteError(null);
                                            setShowInviteModal(false);
                                            loadTravelPlans();
                                        },
                                    },
                                ]);
                            } catch (error: any) {
                                setInviteError(error.message || '초대 수락에 실패했습니다.');
                            } finally {
                                setIsSubmittingCode(false);
                            }
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('Failed to submit invite code:', error);
            setInviteError(error.message || '유효하지 않은 초대 코드입니다.');
            setIsSubmittingCode(false);
        }
    };

    const handleCodeChange = (text: string) => {
        // 코드 입력 시 에러 메시지 초기화
        setInviteError(null);
        setInviteCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    };

    const handleCloseModal = () => {
        setShowInviteModal(false);
        setInviteCode('');
        setInviteError(null);
    };

    const handleMorePress = (tripId: string) => {
        setSelectedTripId(tripId);
        setShowMoreModal(true);
    };

    const handleDeleteTrip = () => {
        if (!selectedTripId) return;

        const trip = travelPlans.find((t) => t.id === selectedTripId);
        const tripTitle = trip?.title || '여행 계획';

        setShowMoreModal(false);
        Alert.alert(
            '삭제 확인',
            `${tripTitle}을(를) 삭제하시겠습니까?`,
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제하기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTravelPlan(selectedTripId);
                            Alert.alert('완료', '여행 계획이 삭제되었습니다.');
                            setSelectedTripId(null);
                        } catch (error: any) {
                            console.error('Failed to delete travel plan:', error);
                            Alert.alert('오류', error.message || '여행 계획 삭제 중 오류가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Text style={styles.brand}>Traveline</Text>
                <View style={styles.headerIcons}>
                    <IconButton
                        icon={(props) => <Feather name="search" size={24} color="#000" />}
                        onPress={() => router.push('/search')}
                        size={24}
                    />
                    <IconButton
                        icon={(props) => <Feather name="bell" size={24} color="#000" />}
                        onPress={() => {
                        }}
                        size={24}
                    />
                </View>
            </View>

            {/* 여행 프레임 */}
            <View style={styles.tripFrame}>
                <View style={styles.profileSection}>
                    <MaterialIcons name="account-circle" size={56} color="#9E9E9E" />
                    <Text style={styles.teamName}>{username}</Text>
                </View>

                {/* 탭 */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
                        onPress={() => setSelectedTab('upcoming')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
                            다가오는 여행
                        </Text>
                        {selectedTab === 'upcoming' && <View style={styles.tabUnderline} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
                        onPress={() => setSelectedTab('past')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'past' && styles.tabTextActive]}>
                            지난 여행
                        </Text>
                        {selectedTab === 'past' && <View style={styles.tabUnderline} />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* 액션 버튼 */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.addButton} onPress={handleNewSchedule}>
                    <Feather name="plus-circle" size={16} color="#000" />
                    <Text style={styles.addButtonText}>새 일정 추가</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={() => setShowInviteModal(true)}
                >
                    <MaterialIcons name="vpn-key" size={16} color="#088CDA" />
                    <Text style={styles.inviteButtonText}>초대 코드 입력</Text>
                </TouchableOpacity>
            </View>

            {/* 초대 코드 입력 모달 */}
            <Modal
                visible={showInviteModal}
                transparent
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={handleCloseModal}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>초대 코드 입력</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={handleCloseModal}
                            >
                                <MaterialIcons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.modalDescription}>
                                6자리 초대 코드를 입력해주세요
                            </Text>
                            <View style={styles.inviteCodeInputContainer}>
                                <TextInput
                                    style={styles.inviteCodeInput}
                                    value={inviteCode}
                                    onChangeText={handleCodeChange}
                                    maxLength={6}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    editable={!isSubmittingCode}
                                    autoFocus
                                />
                            </View>
                            {inviteError && (
                                <View style={styles.errorContainer}>
                                    <MaterialIcons name="error-outline" size={16} color="#F44336" />
                                    <Text style={styles.errorText}>{inviteError}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalCancelButton, isSubmittingCode && styles.buttonDisabled]}
                                onPress={handleCloseModal}
                                disabled={isSubmittingCode}
                            >
                                <Text style={styles.modalCancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmitButton, (isSubmittingCode || !inviteCode.trim()) && styles.buttonDisabled]}
                                onPress={handleSubmitInviteCode}
                                disabled={isSubmittingCode || !inviteCode.trim()}
                            >
                                {isSubmittingCode ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalSubmitButtonText}>확인</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* 더보기 모달 (삭제하기) */}
            <Modal
                visible={showMoreModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMoreModal(false)}
            >
                <TouchableOpacity
                    style={styles.bottomModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMoreModal(false)}
                >
                    <View style={styles.bottomSheet}>
                        <TouchableOpacity
                            style={styles.bottomSheetOption}
                            onPress={handleDeleteTrip}
                        >
                            <Text style={styles.deleteText}>삭제하기</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 여행 목록 */}
            <ScrollView
                style={styles.tripList}
                contentContainerStyle={styles.tripListContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#088CDA']}
                        tintColor="#088CDA"
                    />
                }
            >
                {isLoadingPlans && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#088CDA" />
                        <Text style={styles.loadingText}>여행 계획을 불러오는 중...</Text>
                    </View>
                ) : !isAuthenticated ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            로그인 후 여행 계획을 확인하세요
                        </Text>
                    </View>
                ) : displayedTrips.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {selectedTab === 'upcoming' ? '예정된 여행이 없습니다' : '지난 여행이 없습니다'}
                        </Text>
                    </View>
                ) : (
                    displayedTrips.map((trip) => (
                        <View key={trip.id} style={styles.tripItem}>
                            <TouchableOpacity
                                style={styles.tripContent}
                                onPress={() => handleTripPress(trip.id)}
                            >
                                <MaterialIcons name="date-range" size={24} color="#000" />
                                <View style={styles.tripInfo}>
                                    <Text style={styles.tripTitle}>{trip.title}</Text>
                                    <Text style={styles.tripDate}>
                                        {trip.startDate} - {trip.endDate}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.moreButton}
                                onPress={() => handleMorePress(trip.id)}
                            >
                                <Feather name="more-horizontal" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        paddingBottom: 8,
        paddingHorizontal: 22,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    brand: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
        letterSpacing: -0.3,
        color: '#000',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tripFrame: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 0,
    },
    profileSection: {
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 8,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 25,
        letterSpacing: -0.2,
        color: '#000',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 16,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        position: 'relative',
    },
    tabActive: {},
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 25,
        letterSpacing: -0.2,
        color: '#000',
    },
    tabTextActive: {
        color: '#088CDA',
    },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#088CDA',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 16,
    },
    addButton: {
        flex: 1,
        backgroundColor: '#F6F6F6',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 20,
        letterSpacing: -0.2,
        color: '#000',
    },
    inviteButton: {
        flex: 1,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    inviteButtonText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 20,
        letterSpacing: -0.2,
        color: '#088CDA',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    modalDescription: {
        fontSize: 14,
        color: '#585858',
        marginBottom: 16,
        textAlign: 'center',
    },
    inviteCodeInputContainer: {
        backgroundColor: '#F6F6F6',
        borderRadius: 8,
        paddingHorizontal: 16,
    },
    inviteCodeInput: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 4,
        color: '#000',
        paddingVertical: 16,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 4,
    },
    errorText: {
        fontSize: 14,
        color: '#F44336',
        flex: 1,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#F6F6F6',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    modalSubmitButton: {
        flex: 1,
        backgroundColor: '#088CDA',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSubmitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    tripList: {
        flex: 1,
    },
    tripListContent: {
        paddingHorizontal: 20,
    },
    tripItem: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    tripContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    tripInfo: {
        flex: 1,
    },
    tripTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    tripDate: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.175,
        color: '#000',
    },
    moreButton: {
        padding: 4,
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#585858',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#9E9E9E',
    },
    tripDestination: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
        marginTop: 2,
    },
    bottomModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    bottomSheetOption: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    deleteText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#FF3B30',
    },
});
