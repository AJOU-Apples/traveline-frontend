import React, {useState, useMemo} from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import {Text, IconButton} from 'react-native-paper';
import {router, useFocusEffect} from 'expo-router';
import {Feather, MaterialIcons} from '@expo/vector-icons';
import {useUser} from '../../src/context/UserContext';

export default function ScheduleScreen() {
    const {username, isAuthenticated, travelPlans, loadTravelPlans, isLoadingPlans} = useUser();
    const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
    const [refreshing, setRefreshing] = useState(false);

    // 현재 날짜 기준으로 다가오는 여행과 지난 여행 분류
    const {upcomingTrips, pastTrips} = useMemo(() => {
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

        return {upcomingTrips: upcoming, pastTrips: past};
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
            params: {planId}
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

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <Text style={styles.brand}>Traveline</Text>
                <View style={styles.headerIcons}>
                    <IconButton
                        icon={(props) => <Feather name="search" size={24} color="#000"/>}
                        onPress={() => router.push('/search')}
                        size={24}
                    />
                    <IconButton
                        icon={(props) => <Feather name="bell" size={24} color="#000"/>}
                        onPress={() => {
                        }}
                        size={24}
                    />
                </View>
            </View>

            {/* 여행 프레임 */}
            <View style={styles.tripFrame}>
                <View style={styles.profileSection}>
                    <MaterialIcons name="account-circle" size={56} color="#9E9E9E"/>
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
                        {selectedTab === 'upcoming' && <View style={styles.tabUnderline}/>}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
                        onPress={() => setSelectedTab('past')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'past' && styles.tabTextActive]}>
                            지난 여행
                        </Text>
                        {selectedTab === 'past' && <View style={styles.tabUnderline}/>}
                    </TouchableOpacity>
                </View>
            </View>

            {/* 새 일정 추가 버튼 */}
            <TouchableOpacity style={styles.addButton} onPress={handleNewSchedule}>
                <Feather name="plus-circle" size={16} color="#000"/>
                <Text style={styles.addButtonText}>새 일정 추가</Text>
            </TouchableOpacity>

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
                        <ActivityIndicator size="large" color="#088CDA"/>
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
                        <TouchableOpacity
                            key={trip.id}
                            style={styles.tripItem}
                            onPress={() => handleTripPress(trip.id)}
                        >
                            <View style={styles.tripContent}>
                                <MaterialIcons name="date-range" size={24} color="#000"/>
                                <View style={styles.tripInfo}>
                                    <Text style={styles.tripTitle}>{trip.title}</Text>
                                    <Text style={styles.tripDate}>
                                        {trip.startDate} - {trip.endDate}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.moreButton}>
                                <Feather name="more-horizontal" size={24} color="#000"/>
                            </TouchableOpacity>
                        </TouchableOpacity>
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
        paddingTop: 24,
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
    addButton: {
        backgroundColor: '#F6F6F6',
        borderRadius: 8,
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 20,
        letterSpacing: -0.2,
        color: '#000',
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
});
