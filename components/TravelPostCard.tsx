import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import type { TravelPost } from '../src/types/travelPost.types';
import { getFullImageUrl } from '../src/utils/travelPlanApi';

interface TravelPostCardProps {
  post: TravelPost;
  onPress: () => void;
  onLikePress?: () => void;
}

export default function TravelPostCard({ post, onPress, onLikePress }: TravelPostCardProps) {
  const handleLikePress = (e: any) => {
    e.stopPropagation();
    onLikePress?.();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* 커버 이미지 */}
      {post.coverImageUrl && (
        <Image
          source={{ uri: getFullImageUrl(post.coverImageUrl) }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        {/* 제목 */}
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        {/* 작성자 정보 */}
        <View style={styles.authorRow}>
          {post.author.profileImageUrl ? (
            <Image
              source={{ uri: getFullImageUrl(post.author.profileImageUrl) }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Feather name="user" size={16} color="#999" />
            </View>
          )}
          <Text style={styles.authorName}>{post.author.name}</Text>
        </View>

        {/* 여행 정보 */}
        {post.travelPlan && (
          <View style={styles.travelInfo}>
            <Text style={styles.destination}>{post.travelPlan.destination.name}</Text>
            <Text style={styles.date}>
              {post.travelPlan.startDate} - {post.travelPlan.endDate}
            </Text>
          </View>
        )}

        {/* 통계 */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={handleLikePress}>
            <Feather
              name={post.isLiked ? 'heart' : 'heart'}
              size={16}
              color={post.isLiked ? '#ff4444' : '#999'}
              fill={post.isLiked ? '#ff4444' : 'none'}
            />
            <Text style={[styles.statText, post.isLiked && styles.statTextActive]}>
              {post.likeCount}
            </Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Feather name="message-circle" size={16} color="#999" />
            <Text style={styles.statText}>{post.commentCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="eye" size={16} color="#999" />
            <Text style={styles.statText}>{post.viewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  authorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 12,
    color: '#585858',
    fontWeight: '600',
  },
  travelInfo: {
    marginBottom: 12,
    gap: 4,
  },
  destination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  date: {
    fontSize: 12,
    color: '#585858',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  statTextActive: {
    color: '#ff4444',
  },
});

