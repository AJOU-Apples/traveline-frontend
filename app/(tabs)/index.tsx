import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useUser } from '../../src/context/UserContext';
import TravelCard from '../../components/TravelCard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width;
const horizontalCardWidth = 200;

const ddays = (iso: string) => {
    const now = new Date();
    const target = new Date(iso);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

export default function LandingPage() {
    const { username, isAuthenticated, popularTrips, recentTrips, travelPlans } = useUser();

    // 새 일정 추가 핸들러
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

    // 다가오는 여행 찾기 (저장된 여행 계획 중 가장 가까운 것)
    const upcomingPlan = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = travelPlans
            .filter(plan => {
                const startDate = new Date(plan.startDate.replace(/\./g, '-'));
                return startDate >= today;
            })
            .sort((a, b) => {
                const dateA = new Date(a.startDate.replace(/\./g, '-'));
                const dateB = new Date(b.startDate.replace(/\./g, '-'));
                return dateA.getTime() - dateB.getTime();
            });

        return upcoming[0] || null;
    }, [travelPlans]);

    const d = upcomingPlan
        ? ddays(new Date(upcomingPlan.startDate.replace(/\./g, '-')).toISOString())
        : null;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text variant="headlineMedium" style={styles.brand}>Traveline</Text>
                    <View style={styles.headerIcons}>
                        <IconButton
                            icon={(props) => <Feather name="search" size={24} color="#000" />}
                            onPress={() => router.push('/search')}
                            size={24}
                        />
                        <IconButton
                            icon={(props) => <Feather name="bell" size={24} color="#000" />}
                            onPress={() => { }}
                            size={24}
                        />
                    </View>
                </View>

                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText}>
                        <Text style={styles.primary}>{username}</Text>
                        <Text style={styles.greetingNormal}>님,</Text>
                    </Text>
                    <Text style={styles.greetingText}>
                        {upcomingPlan ? '설레는 여행이 다가오고 있어요.' : '어디로 여행을 떠나시나요?'}
                    </Text>
                </View>

                {/* D-day Highlight */}
                <TouchableOpacity
                    style={styles.ddayContainer}
                    onPress={() => {
                        if (upcomingPlan) {
                            router.push({
                                pathname: '/plan-detail',
                                params: { planId: upcomingPlan.id }
                            });
                        } else {
                            handleNewSchedule();
                        }
                    }}
                    activeOpacity={0.7}
                >
                    {upcomingPlan && d !== null ? (
                        <Text style={styles.ddayText}>
                            {upcomingPlan.destination} 여행, D-{d}
                        </Text>
                    ) : (
                        <Text style={styles.ddayText}>
                            새로운 여행을 계획해보세요!
                        </Text>
                    )}
                </TouchableOpacity>

                <Surface style={styles.highlightBox} elevation={0}>
                    <View style={styles.highlightHeader}>
                        <Text style={styles.highlightText}>
                            <Text style={styles.primary}>{username}</Text>
                            <Text style={styles.highlightNormal}>님, 떠날 준비되셨나요?</Text>
                        </Text>
                        <Text style={styles.highlightSub}>모두가 주목한 인기 여행이에요.</Text>
                    </View>

                    {/* Popular Trips - 인기 여행 */}
                    <View style={styles.horizontalScrollSection}>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.cardList}
                            data={popularTrips}
                            renderItem={({ item }) => <TravelCard trip={item} width={horizontalCardWidth} />}
                            keyExtractor={(item) => item.id}
                        />
                    </View>

                    {/* Latest section - 최신 여행기 */}
                    <Text style={styles.sectionTitle}>최신 여행기</Text>
                    <View style={styles.horizontalScrollSection}>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.cardList}
                            data={recentTrips}
                            renderItem={({ item }) => <TravelCard trip={item} width={horizontalCardWidth} />}
                            keyExtractor={(item) => item.id}
                        />
                    </View>
                </Surface>
            </ScrollView>

            <TouchableOpacity
                onPress={handleNewSchedule}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#0BB4FE', '#5FE2BE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.fab}
                >
                    <View style={styles.fabContent}>
                        <Feather name="plus-circle" size={16} color="#fff" />
                        <Text style={styles.fabText}>새 일정 추가</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scroll: {
        padding: 20,
        paddingTop: 44,
        paddingBottom: 120
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28
    },
    brand: {
        fontWeight: '600',
        fontSize: 24,
        lineHeight: 32,
        letterSpacing: -0.3,
        color: '#000'
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 8
    },
    greetingSection: {
        marginBottom: 24
    },
    greetingText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2
    },
    greetingNormal: {
        color: '#000',
        fontWeight: '400'
    },
    primary: {
        color: '#176ADA',
        fontWeight: '600'
    },
    ddayContainer: {
        alignItems: 'flex-end',
        marginBottom: 16
    },
    ddayText: {
        fontSize: 24,
        lineHeight: 32,
        letterSpacing: -0.3,
        color: '#176ADA',
        fontWeight: '600'
    },
    highlightBox: {
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#fff'
    },
    highlightHeader: {
        marginBottom: 8
    },
    highlightText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2
    },
    highlightNormal: {
        color: '#000',
        fontWeight: '400'
    },
    highlightSub: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        fontWeight: '400',
        marginTop: 2
    },
    horizontalScrollSection: {
        width: '100%',
    },
    cardList: {
        paddingVertical: 10,
        paddingHorizontal: 2,
        gap: 8
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 8,
        color: '#000'
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 15,
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4
    },
    fabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    fabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: -0.2,
        lineHeight: 20
    }
});
