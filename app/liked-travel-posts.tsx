import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTravelPost } from '../src/hooks/useTravelPost';
import TravelPostCard from '../components/TravelPostCard';
import type { TravelPost } from '../src/types/travelPost.types';

export default function LikedTravelPostsScreen() {
  const router = useRouter();
  const { getLikedTravelPosts, isLoading } = useTravelPost();

  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(
    async (pageNum: number, isRefresh: boolean = false) => {
      try {
        const response = await getLikedTravelPosts({ page: pageNum, size: 10 });

        // 숨김 처리된 여행기 필터링
        const filteredContent = response.content.filter((post) => !post.isHidden);

        if (isRefresh) {
          setPosts(filteredContent);
        } else {
          setPosts((prev) => [...prev, ...filteredContent]);
        }

        setHasMore(!response.last);
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to load liked posts:', error);
      }
    },
    [getLikedTravelPosts]
  );

  useEffect(() => {
    loadPosts(0, true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts(0, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadPosts(page + 1);
    }
  };

  const handlePostPress = (postId: number) => {
    router.push({
      pathname: '/travel-post-detail',
      params: { id: postId.toString() },
    });
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="favorite-border" size={64} color="#CCC" />
        <Text style={styles.emptyText}>좋아요한 여행기가 없습니다</Text>
        <Text style={styles.emptySubtext}>
          마음에 드는 여행기에 좋아요를 눌러보세요
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/travel-posts')}
        >
          <Text style={styles.exploreButtonText}>여행기 둘러보기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>저장된 여행기</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 여행기 목록 */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TravelPostCard post={item} onPress={() => handlePostPress(item.id)} />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  exploreButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

