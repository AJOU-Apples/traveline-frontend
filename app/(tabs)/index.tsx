import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Dimensions, TouchableOpacity, Alert, Image } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useUser } from '../../src/context/UserContext';
import TravelCard from '../../components/TravelCard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTravelPost } from '../../src/hooks/useTravelPost';
import type { TravelPost } from '../../src/types/travelPost.types';
import { getFullImageUrl } from '../../src/utils/travelPlanApi';

const screenWidth = Dimensions.get('window').width;
const horizontalCardWidth = 200;

// 랜딩 페이지용 여행기 카드 컴포넌트
function TravelPostCard({
    post,
    demoImage,
    onPress,
}: {
    post: TravelPost;
    demoImage: string;
    onPress: () => void;
}) {
    const imageUrl = post.coverImageUrl
        ? getFullImageUrl(post.coverImageUrl)
        : demoImage;

    return (
        <TouchableOpacity
            style={styles.postCard}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Image
                source={{ uri: imageUrl }}
                style={styles.postCardImage}
                resizeMode="cover"
            />
            <View style={styles.postCardContent}>
                <Text style={styles.postCardTitle} numberOfLines={2}>
                    {post.title}
                </Text>
                <Text style={styles.postCardAuthor} numberOfLines={1}>
                    {post.author.name}
                </Text>
                <View style={styles.postCardStats}>
                    <View style={styles.postCardStatItem}>
                        <Feather name="heart" size={12} color="#ff4444" />
                        <Text style={styles.postCardStatText}>{post.likeCount}</Text>
                    </View>
                    <View style={styles.postCardStatItem}>
                        <Feather name="eye" size={12} color="#999" />
                        <Text style={styles.postCardStatText}>{post.viewCount}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const ddays = (iso: string) => {
    const now = new Date();
    const target = new Date(iso);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

// 데모 이미지 URL들
const DEMO_IMAGES = [
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', // 일본 도쿄
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400', // 파리
    'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400', // 방콕
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400', // 시드니
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400', // 런던
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400', // 로마
];

export default function LandingPage() {
    const { username, isAuthenticated, travelPlans } = useUser();
    const { getTravelPosts } = useTravelPost();

    // 여행기 데이터 상태
    const [popularPosts, setPopularPosts] = useState<TravelPost[]>([]);
    const [recentPosts, setRecentPosts] = useState<TravelPost[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    // 여행기 데이터 로드 함수
    const loadTravelPosts = useCallback(async () => {
        setIsLoadingPosts(true);
        try {
            // 인기순 여행기 (좋아요 높은 순)
            const popularResponse = await getTravelPosts({
                page: 0,
                size: 5,
                visibility: 'PUBLIC',
                sort: 'likeCount',
            });
            // 숨김 처리된 여행기 필터링
            setPopularPosts(popularResponse.content.filter((post) => !post.isHidden));

            // 최신순 여행기
            const recentResponse = await getTravelPosts({
                page: 0,
                size: 5,
                visibility: 'PUBLIC',
                sort: 'createdAt',
            });
            // 숨김 처리된 여행기 필터링
            setRecentPosts(recentResponse.content.filter((post) => !post.isHidden));
        } catch (error) {
            console.error('Failed to load travel posts:', error);
        } finally {
            setIsLoadingPosts(false);
        }
    }, [getTravelPosts]);

    // 화면 포커스될 때마다 데이터 새로고침
    useFocusEffect(
        useCallback(() => {
            loadTravelPosts();
        }, [loadTravelPosts])
    );

    // 여행기 카드 클릭 핸들러
    const handlePostPress = useCallback((postId: number) => {
        router.push({
            pathname: '/travel-post-detail',
            params: { id: postId.toString() }
        });
    }, []);

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

                    {/* Popular Trips - 인기 여행기 */}
                    <View style={styles.horizontalScrollSection}>
                        {popularPosts.length > 0 ? (
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.cardList}
                                data={popularPosts}
                                renderItem={({ item, index }) => (
                                    <TravelPostCard
                                        post={item}
                                        demoImage={DEMO_IMAGES[index % DEMO_IMAGES.length]}
                                        onPress={() => handlePostPress(item.id)}
                                    />
                                )}
                                keyExtractor={(item) => item.id.toString()}
                            />
                        ) : (
                            <View style={styles.emptyPostsContainer}>
                                <Text style={styles.emptyPostsText}>
                                    {isLoadingPosts ? '여행기를 불러오는 중...' : '아직 등록된 여행기가 없습니다.'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Latest section - 최신 여행기 */}
                    <Text style={styles.sectionTitle}>최신 여행기</Text>
                    <View style={styles.horizontalScrollSection}>
                        {recentPosts.length > 0 ? (
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.cardList}
                                data={recentPosts}
                                renderItem={({ item, index }) => (
                                    <TravelPostCard
                                        post={item}
                                        demoImage={DEMO_IMAGES[(index + 3) % DEMO_IMAGES.length]}
                                        onPress={() => handlePostPress(item.id)}
                                    />
                                )}
                                keyExtractor={(item) => item.id.toString()}
                            />
                        ) : (
                            <View style={styles.emptyPostsContainer}>
                                <Text style={styles.emptyPostsText}>
                                    {isLoadingPosts ? '여행기를 불러오는 중...' : '아직 등록된 여행기가 없습니다.'}
                                </Text>
                            </View>
                        )}
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
    },
    // 여행기 카드 스타일
    postCard: {
        width: horizontalCardWidth,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postCardImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#f0f0f0',
    },
    postCardContent: {
        padding: 12,
    },
    postCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
        lineHeight: 18,
    },
    postCardAuthor: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    postCardStats: {
        flexDirection: 'row',
        gap: 12,
    },
    postCardStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    postCardStatText: {
        fontSize: 11,
        color: '#999',
    },
    emptyPostsContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        width: '100%',
    },
    emptyPostsText: {
        fontSize: 14,
        color: '#999',
    },
});
