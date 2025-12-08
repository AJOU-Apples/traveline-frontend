import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTravelPost } from '../src/hooks/useTravelPost';
import type { TravelPost } from '../src/types/travelPost.types';
import { getFullImageUrl } from '../src/utils/travelPlanApi';

export default function SearchScreen() {
    const insets = useSafeAreaInsets();
    const { getTravelPosts, isLoading } = useTravelPost();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<TravelPost[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setHasSearched(false);
            setResults([]);
            return;
        }

        try {
            setHasSearched(true);
            const response = await getTravelPosts({
                page: 0,
                size: 50,
                visibility: 'PUBLIC',
                keyword: query.trim(),
            });

            const searchKeyword = query.trim().toLowerCase();

            // 숨김 처리된 여행기 필터링 + 검색어 매칭 필터링
            const filteredResults = response.content.filter((post) => {
                // 숨김 처리된 항목 제외
                if (post.isHidden) return false;

                // 제목이나 내용에 검색어가 포함되어 있는지 확인
                const titleMatch = post.title.toLowerCase().includes(searchKeyword);
                const contentMatch = post.content?.toLowerCase().includes(searchKeyword) || false;

                // 여행 계획의 목적지에도 검색어가 포함되어 있는지 확인
                const destinationMatch = post.travelPlan?.destination?.name
                    ?.toLowerCase().includes(searchKeyword) || false;

                return titleMatch || contentMatch || destinationMatch;
            });

            setResults(filteredResults);
        } catch (error) {
            console.error('Failed to search travel posts:', error);
            setResults([]);
        }
    }, [getTravelPosts]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);

        // 이전 타이머 취소
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // 검색어가 비어있으면 즉시 초기화
        if (!query.trim()) {
            setHasSearched(false);
            setResults([]);
            return;
        }

        // 디바운싱: 500ms 후에 검색 실행
        const timeout = setTimeout(() => {
            performSearch(query);
        }, 500);

        setSearchTimeout(timeout);
    }, [performSearch, searchTimeout]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    const handlePostPress = useCallback((postId: number) => {
        router.push({
            pathname: '/travel-post-detail',
            params: { id: postId.toString() }
        });
    }, []);

    const renderResultItem = ({ item }: { item: TravelPost }) => {
        const imageUrl = item.coverImageUrl
            ? getFullImageUrl(item.coverImageUrl)
            : 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400';

        return (
            <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handlePostPress(item.id)}
                activeOpacity={0.7}
            >
                {item.coverImageUrl && (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.resultImage}
                        resizeMode="cover"
                    />
                )}
                <View style={styles.resultContent}>
                    <Text style={styles.resultName} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.resultAuthor} numberOfLines={1}>
                        {item.author.name}
                    </Text>
                    <View style={styles.resultStats}>
                        <View style={styles.resultStatItem}>
                            <Feather name="heart" size={14} color="#ff4444" />
                            <Text style={styles.resultStatText}>{item.likeCount}</Text>
                        </View>
                        <View style={styles.resultStatItem}>
                            <Feather name="eye" size={14} color="#999" />
                            <Text style={styles.resultStatText}>{item.viewCount}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.searchBarContainer}>
                    <Searchbar
                        placeholder="검색어를 입력하세요"
                        onChangeText={handleSearch}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        autoFocus
                    />
                </View>
            </View>

            <FlatList
                data={results}
                renderItem={renderResultItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="large" color="#088cda" />
                        </View>
                    ) : hasSearched && searchQuery.trim() ? (
                        <View style={styles.emptyContainer}>
                            <Feather name="search" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
                            <Text style={styles.emptySubtext}>다른 검색어를 입력해보세요</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Feather name="search" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>여행기를 검색해보세요</Text>
                            <Text style={styles.emptySubtext}>제목이나 내용으로 검색할 수 있어요</Text>
                        </View>
                    )
                }
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
        backgroundColor: '#fff',
        paddingBottom: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    searchBarContainer: {
        flex: 1,
    },
    searchBar: {
        backgroundColor: '#ECECEC',
        borderRadius: 8,
        height: 40,
        elevation: 0,
    },
    searchInput: {
        fontSize: 16,
        minHeight: 0,
        paddingVertical: 0,
    },
    listContainer: {
        padding: 20,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    resultImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginRight: 12,
    },
    resultContent: {
        flex: 1,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
        lineHeight: 22,
    },
    resultAuthor: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    resultStats: {
        flexDirection: 'row',
        gap: 16,
    },
    resultStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    resultStatText: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
    },
});

