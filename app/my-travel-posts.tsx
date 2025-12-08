import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTravelPost } from '../src/hooks/useTravelPost';
import TravelPostCard from '../components/TravelPostCard';
import type { TravelPost } from '../src/types/travelPost.types';

export default function MyTravelPostsScreen() {
  const insets = useSafeAreaInsets();
  const { getMyTravelPosts, toggleLike, deleteTravelPost, isLoading } = useTravelPost();

  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(
    async (pageNum: number = 0, reset: boolean = false) => {
      try {
        const response = await getMyTravelPosts({
          page: pageNum,
          size: 20,
        });

        // 숨김 처리된 여행기 필터링 (본인 여행기이지만 숨김 처리된 경우도 제외)
        const filteredContent = response.content.filter((post) => !post.isHidden);

        if (reset) {
          setPosts(filteredContent);
        } else {
          setPosts((prev) => [...prev, ...filteredContent]);
        }

        setHasMore(pageNum < response.totalPages - 1);
      } catch (error) {
        console.error('Failed to load my travel posts:', error);
      }
    },
    [getMyTravelPosts]
  );

  useEffect(() => {
    loadPosts(0, true);
  }, []);

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

  const handleDelete = useCallback(
    async (postId: number) => {
      Alert.alert('삭제 확인', '여행기를 삭제하시겠습니까?', [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTravelPost(postId);
              setPosts((prev) => prev.filter((post) => post.id !== postId));
              Alert.alert('완료', '여행기가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', '여행기 삭제에 실패했습니다.');
            }
          },
        },
      ]);
    },
    [deleteTravelPost]
  );

  const renderPost = useCallback(
    ({ item }: { item: TravelPost }) => (
      <View style={styles.postContainer}>
        <TravelPostCard
          post={item}
          onPress={() => handlePostPress(item.id)}
          onLikePress={() => handleLike(item.id)}
        />
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/create-travel-post',
              params: { editId: item.id.toString() }
            })}
          >
            <Feather name="edit-2" size={16} color="#088cda" />
            <Text style={styles.actionText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
          >
            <Feather name="trash-2" size={16} color="#ff4444" />
            <Text style={[styles.actionText, styles.deleteText]}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handlePostPress, handleLike, handleDelete]
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
      <Text style={styles.emptyText}>작성한 여행기가 없습니다.</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/create-travel-post')}
      >
        <Text style={styles.createButtonText}>여행기 만들기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 여행기</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-travel-post')}
        >
          <Feather name="plus" size={24} color="#088cda" />
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  listContent: {
    padding: 20,
  },
  postContainer: {
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  deleteButton: {
    // 추가 스타일 없음
  },
  actionText: {
    fontSize: 14,
    color: '#088cda',
    fontWeight: '600',
  },
  deleteText: {
    color: '#ff4444',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#088cda',
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

