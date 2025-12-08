import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import type { TravelPostComment } from '../src/types/travelPost.types';
import { getFullImageUrl } from '../src/utils/travelPlanApi';

interface TravelPostCommentItemProps {
  comment: TravelPostComment;
  currentUserId?: number;
  onLikePress?: () => void;
  onReplyPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  onReportPress?: () => void;
  showReplyInput?: boolean;
  onReplySubmit?: (content: string) => void;
  onReplyCancel?: () => void;
  isAuthenticated?: boolean;
}

export default function TravelPostCommentItem({
  comment,
  currentUserId,
  onLikePress,
  onReplyPress,
  onEditPress,
  onDeletePress,
  onReportPress,
  showReplyInput = false,
  onReplySubmit,
  onReplyCancel,
  isAuthenticated = false,
}: TravelPostCommentItemProps) {
  const [replyContent, setReplyContent] = useState('');
  const isAuthor = currentUserId === comment.user.id;
  const showReportButton = isAuthenticated && !isAuthor && !comment.isHidden;

  // 숨김 처리된 댓글은 액션 버튼 숨김
  const showActions = !comment.isHidden;

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReplySubmit?.(replyContent.trim());
      setReplyContent('');
    }
  };

  return (
    <View style={styles.container}>
      {/* 댓글 내용 */}
      <View style={styles.commentContent}>
        {/* 작성자 정보 */}
        <View style={styles.authorRow}>
          {comment.user.profileImageUrl ? (
            <Image
              source={{ uri: getFullImageUrl(comment.user.profileImageUrl) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={16} color="#999" />
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{comment.user.name}</Text>
            <Text style={styles.commentTime}>
              {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* 댓글 텍스트 */}
        {comment.isHidden ? (
          <Text style={styles.hiddenText}>이 댓글은 신고로 인해 숨김 처리되었습니다.</Text>
        ) : (
          <Text style={styles.commentText}>{comment.content}</Text>
        )}

        {/* 액션 버튼 */}
        {showActions && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={onLikePress}>
              <Feather
                name={comment.isLiked ? 'heart' : 'heart'}
                size={16}
                color={comment.isLiked ? '#ff4444' : '#999'}
                fill={comment.isLiked ? '#ff4444' : 'none'}
              />
              <Text style={[styles.actionText, comment.isLiked && styles.actionTextActive]}>
                {comment.likeCount > 0 ? comment.likeCount : ''}
              </Text>
            </TouchableOpacity>
            {!comment.parentCommentId && (
              <TouchableOpacity style={styles.actionButton} onPress={onReplyPress}>
                <Feather name="message-circle" size={16} color="#999" />
                <Text style={styles.actionText}>답글</Text>
              </TouchableOpacity>
            )}
            {isAuthor && (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={onEditPress}>
                  <Feather name="edit-2" size={16} color="#999" />
                  <Text style={styles.actionText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onDeletePress}>
                  <Feather name="trash-2" size={16} color="#999" />
                  <Text style={styles.actionText}>삭제</Text>
                </TouchableOpacity>
              </>
            )}
            {showReportButton && (
              <TouchableOpacity style={styles.actionButton} onPress={onReportPress}>
                <Feather name="flag" size={16} color="#999" />
                <Text style={styles.actionText}>신고</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 답글 입력 */}
        {showReplyInput && (
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              value={replyContent}
              onChangeText={setReplyContent}
              placeholder="답글을 입력하세요"
              placeholderTextColor="#999"
              multiline
            />
            <View style={styles.replyActions}>
              <TouchableOpacity onPress={onReplyCancel}>
                <Text style={styles.replyCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReplySubmit}>
                <Text style={styles.replySubmitText}>등록</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies
            .filter((reply) => !reply.isHidden) // 숨김 처리된 대댓글 제외
            .map((reply) => (
              <TravelPostCommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
                onLikePress={() => {
                  // TODO: 대댓글 좋아요 처리
                }}
                onReportPress={onReportPress}
              />
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  commentContent: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 8,
  },
  hiddenText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#999',
  },
  actionTextActive: {
    color: '#ff4444',
  },
  replyInputContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  replyInput: {
    fontSize: 14,
    color: '#000',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  replyCancelText: {
    fontSize: 14,
    color: '#585858',
    fontWeight: '600',
  },
  replySubmitText: {
    fontSize: 14,
    color: '#088cda',
    fontWeight: '600',
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
});

