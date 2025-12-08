import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTravelPost } from '../src/hooks/useTravelPost';
import TravelPostCard from '../components/TravelPostCard';
import type { TravelPost } from '../src/types/travelPost.types';

export default function TravelPostsScreen() {
  const insets = useSafeAreaInsets();
  const { getTravelPosts, toggleLike, isLoading } = useTravelPost();

  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'likeCount' | 'viewCount'>('createdAt');

  const loadPosts = useCallback(
    async (pageNum: number = 0, reset: boolean = false) => {
      try {
        const response = await getTravelPosts({
          page: pageNum,
          size: 20,
          visibility: 'PUBLIC',
          sort: sortBy,
        });

        // 숨김 처리된 여행기 필터링
        const filteredContent = response.content.filter((post) => !post.isHidden);

        if (reset) {
          setPosts(filteredContent);
        } else {
          setPosts((prev) => [...prev, ...filteredContent]);
        }

        setHasMore(pageNum < response.totalPages - 1);
      } catch (error) {
        console.error('Failed to load travel posts:', error);
      }
    },
    [getTravelPosts, sortBy]
  );

  useEffect(() => {
    loadPosts(0, true);
  }, [sortBy]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    await loadPosts(0, true);
    setRefreshing(false);
  }, [loadPosts]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, false);
    }
  }, [isLoading, hasMore, page, loadPosts]);

  const handleLike = useCallback(
    async (postId: number) => {
      try {
        const result = await toggleLike(postId);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, isLiked: result.isLiked, likeCount: result.likeCount }
              : post
          )
        );
      } catch (error) {
        console.error('Failed to toggle like:', error);
      }
    },
    [toggleLike]
  );

  const handlePostPress = useCallback((postId: number) => {
    router.push({
      pathname: '/travel-post-detail',
      params: { id: postId.toString() }
    });
  }, []);

  const renderPost = useCallback(
    ({ item }: { item: TravelPost }) => (
      <TravelPostCard
        post={item}
        onPress={() => handlePostPress(item.id)}
        onLikePress={() => handleLike(item.id)}
      />
    ),
    [handlePostPress, handleLike]
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#088cda" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="book-open" size={48} color="#ccc" />
      <Text style={styles.emptyText}>아직 등록된 여행기가 없습니다.</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>여행기</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'createdAt' && styles.sortButtonActive]}
            onPress={() => setSortBy('createdAt')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'createdAt' && styles.sortButtonTextActive]}>
              최신순
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'likeCount' && styles.sortButtonActive]}
            onPress={() => setSortBy('likeCount')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'likeCount' && styles.sortButtonTextActive]}>
              인기순
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 목록 */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: '#088cda',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

