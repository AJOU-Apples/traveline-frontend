import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Calendar, DateData } from 'react-native-calendars';
import { useUser } from '../src/context/UserContext';
import { useTravelPost } from '../src/hooks/useTravelPost';
import TravelPostCommentItem from '../components/TravelPostCommentItem';
import ReportModal from '../components/ReportModal';
import type { TravelPost, TravelPostComment, ReportReason } from '../src/types/travelPost.types';
import { getFullImageUrl, travelPlanApi, TravelPlanFullDto } from '../src/utils/travelPlanApi';

export default function TravelPostDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const postId = params.id ? parseInt(params.id as string) : null;
  const { authUser, isAuthenticated, loadTravelPlans } = useUser();
  const { getTravelPost, toggleLike, getComments, createComment, toggleCommentLike, copyTravelPlanFromPost, reportTravelPost, reportComment, isLoading } =
    useTravelPost();

  const [post, setPost] = useState<TravelPost | null>(null);
  const [travelPlanFull, setTravelPlanFull] = useState<TravelPlanFullDto | null>(null);
  const [comments, setComments] = useState<TravelPostComment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommentReportModal, setShowCommentReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);

  // 일정 복사 관련 상태
  const [showCopyConfirmModal, setShowCopyConfirmModal] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  // 댓글 입력창으로 스크롤
  const scrollToCommentInput = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, []);

  // 댓글 입력창 포커스 핸들러
  const handleCommentInputFocus = useCallback(() => {
    if (!isAuthenticated) {
      Keyboard.dismiss();
      setShowLoginModal(true);
      return;
    }
    scrollToCommentInput();
  }, [isAuthenticated, scrollToCommentInput]);

  // 버튼 표시 조건: 로그인 상태 + 본인 여행기가 아닌 경우
  const showCopyButton = isAuthenticated && post?.author?.id !== authUser?.id;

  // 신고 버튼 표시 조건: 로그인 상태 + 본인 여행기가 아닌 경우 + 숨김 처리되지 않은 경우
  const showReportButton = isAuthenticated && post?.author?.id !== authUser?.id && !post?.isHidden;

  // 여행기 신고 처리
  const handleReport = async (reason: ReportReason, description?: string) => {
    if (!postId) return;
    try {
      await reportTravelPost(postId, { reason, description });
      Alert.alert('신고 접수 완료', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '신고 접수에 실패했습니다.');
      throw error;
    }
  };

  // 댓글 신고 처리
  const handleCommentReport = async (reason: ReportReason, description?: string) => {
    if (!postId || !reportingCommentId) return;
    try {
      await reportComment(postId, reportingCommentId, { reason, description });
      Alert.alert('신고 접수 완료', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      setReportingCommentId(null);
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '신고 접수에 실패했습니다.');
      throw error;
    }
  };

  // 댓글 신고 버튼 클릭
  const handleCommentReportPress = (commentId: number) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setReportingCommentId(commentId);
    setShowCommentReportModal(true);
  };

  // 원본 여행 일수 계산
  const tripDays = useMemo(() => {
    if (!travelPlanFull?.startDate || !travelPlanFull?.endDate) return 1;
    const start = new Date(travelPlanFull.startDate.replace(/\./g, '-'));
    const end = new Date(travelPlanFull.endDate.replace(/\./g, '-'));
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [travelPlanFull]);

  // 종료일 계산 (YYYY-MM-DD 형식)
  const calculatedEndDate = useMemo(() => {
    if (!selectedStartDate || tripDays <= 0) return null;
    const start = new Date(selectedStartDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + tripDays - 1);
    return endDate.toISOString().split('T')[0];
  }, [selectedStartDate, tripDays]);

  // 캘린더 표시용 markedDates 생성
  const getMarkedDates = useMemo(() => {
    const marked: any = {};

    if (selectedStartDate && calculatedEndDate) {
      const start = new Date(selectedStartDate);
      const end = new Date(calculatedEndDate);
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateString = currentDate.toISOString().split('T')[0];

        if (dateString === selectedStartDate && dateString === calculatedEndDate) {
          // 시작일과 종료일이 같은 경우
          marked[dateString] = {
            selected: true,
            selectedColor: '#088CDA',
            selectedTextColor: '#fff',
          };
        } else if (dateString === selectedStartDate) {
          // 시작일
          marked[dateString] = {
            startingDay: true,
            color: '#088CDA',
            textColor: '#fff',
          };
        } else if (dateString === calculatedEndDate) {
          // 종료일
          marked[dateString] = {
            endingDay: true,
            color: '#088CDA',
            textColor: '#fff',
          };
        } else {
          // 중간 날짜
          marked[dateString] = {
            color: '#088CDA',
            textColor: '#fff',
          };
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (selectedStartDate && !calculatedEndDate) {
      marked[selectedStartDate] = {
        startingDay: true,
        endingDay: true,
        color: '#088CDA',
        textColor: '#fff',
      };
    }

    return marked;
  }, [selectedStartDate, calculatedEndDate]);

  // 날짜 선택 핸들러
  const handleDayPress = useCallback((day: DateData) => {
    setSelectedStartDate(day.dateString);
  }, []);

  // 날짜 표시 포맷팅 (YYYY.MM.DD)
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 날짜 표시 포맷팅 (M월 D일)
  const formatDateDisplayShort = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 여행 계획 복사 핸들러
  const handleCopyPlan = async () => {
    if (!post || !selectedStartDate) return;

    setIsCopying(true);
    try {
      const newPlan = await copyTravelPlanFromPost(post.id, selectedStartDate);

      // 여행 계획 목록 새로고침
      await loadTravelPlans();

      setShowDatePickerModal(false);

      Alert.alert(
        '생성 완료',
        '새로운 여행 계획이 생성되었습니다!',
        [
          { text: '나중에 보기', style: 'cancel' },
          {
            text: '바로 확인',
            onPress: () => router.push({
              pathname: '/plan-detail',
              params: { planId: newPlan.id.toString() }
            })
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '여행 계획 생성에 실패했습니다.');
    } finally {
      setIsCopying(false);
    }
  };

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  // 여행기 로드 후 여행 계획 상세 데이터 로드
  useEffect(() => {
    if (post?.travelPlanId) {
      loadTravelPlanFull();
    }
  }, [post?.travelPlanId]);

  const loadTravelPlanFull = async () => {
    if (!post?.travelPlanId) return;
    try {
      const data = await travelPlanApi.getTravelPlanFull(post.travelPlanId, {
        includePhotos: true,
        includeExpenses: post.expenseDisplayType !== 'NONE',
        includeMemos: true,
        travelPostId: post.id, // 게스트 모드에서 여행기 조회 시 필요
      });
      setTravelPlanFull(data);
    } catch (error) {
      console.error('Failed to load travel plan full:', error);
    }
  };

  // 날짜 포맷팅
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString.replace(/\./g, '-'));
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  }, []);

  // 지출 합계 계산
  const calculateExpenseTotal = useCallback((expenses: { amount?: number }[]) => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, []);

  const loadPost = async () => {
    if (!postId) return;
    try {
      const data = await getTravelPost(postId);
      setPost(data);
    } catch (error) {
      Alert.alert('오류', '여행기를 불러오는데 실패했습니다.');
      router.back();
    }
  };

  const loadComments = async () => {
    if (!postId) return;
    try {
      const response = await getComments(postId, { page: 0, size: 100 });
      // 숨김 처리된 댓글 필터링
      setComments(response.content.filter((comment) => !comment.isHidden));
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    if (!postId) return;

    // 게스트 모드 체크
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      const result = await toggleLike(postId);
      setPost((prev) =>
        prev
          ? { ...prev, isLiked: result.isLiked, likeCount: result.likeCount }
          : null
      );
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleCommentSubmit = async (content?: string) => {
    // 게스트 모드 체크
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const submitContent = content || commentContent;
    if (!postId || !submitContent.trim()) return;

    try {
      await createComment(postId, {
        content: submitContent.trim(),
        parentCommentId: replyingTo || undefined,
      });
      setCommentContent('');
      setReplyingTo(null);
      await loadComments();
    } catch (error) {
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (!postId) return;

    // 게스트 모드 체크
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      const result = await toggleCommentLike(postId, commentId);
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, isLiked: result.isLiked, likeCount: result.likeCount };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId
                  ? { ...reply, isLiked: result.isLiked, likeCount: result.likeCount }
                  : reply
              ),
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
    }
  };

  const handleShare = async () => {
    if (!post) return;

    // 게스트 모드 체크
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (post.visibility === 'PRIVATE') {
      Alert.alert('알림', '비공개 여행기는 공유할 수 없습니다.');
      return;
    }

    if (post.shareCode) {
      await Clipboard.setStringAsync(post.shareCode);
      Alert.alert(
        '공유 코드 복사 완료',
        `공유 코드: ${post.shareCode}\n\n이 코드를 공유하면 다른 사람도 여행기를 볼 수 있어요.`
      );
    } else {
      Alert.alert('알림', '공유 코드가 없습니다.');
    }
  };

  // 숨김 처리된 여행기 체크
  if (!post) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#088cda" />
      </View>
    );
  }

  if (post.isHidden) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>이 여행기는 신고로 인해 숨김 처리되었습니다.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {showReportButton && (
            <TouchableOpacity
              onPress={() => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                } else {
                  setShowReportModal(true);
                }
              }}
              style={styles.reportButton}
            >
              <Feather name="flag" size={20} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleShare}>
            <Feather name="share-2" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 커버 이미지 */}
        {post.coverImageUrl && (
          <Image
            source={{ uri: getFullImageUrl(post.coverImageUrl) }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        {/* 제목 */}
        <Text style={styles.title}>{post.title}</Text>

        {/* 작성자 정보 */}
        <View style={styles.authorRow}>
          {post.author.profileImageUrl ? (
            <Image
              source={{ uri: getFullImageUrl(post.author.profileImageUrl) }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Feather name="user" size={20} color="#999" />
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.postDate}>
              {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* 내용 */}
        {post.content && <Text style={styles.content}>{post.content}</Text>}

        {/* 여행 정보 */}
        {(post.travelPlan || travelPlanFull) && (
          <View style={styles.travelPlanSection}>
            <Text style={styles.destination}>
              {travelPlanFull?.destination?.name || (post.travelPlan as any)?.destination?.name || ''}
            </Text>
            <Text style={styles.travelDate}>
              {travelPlanFull?.startDate || post.travelPlan?.startDate} - {travelPlanFull?.endDate || post.travelPlan?.endDate}
            </Text>

            {/* 일차별 일정 */}
            {travelPlanFull?.days?.map((day) => {
              const dayPlaces = day.places || [];
              if (dayPlaces.length === 0) return null;

              return (
                <View key={day.id} style={styles.daySection}>
                  {/* 일차 헤더 */}
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayNumber}>{day.dayNumber}일차</Text>
                    <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                  </View>

                  {/* 타임라인 컨테이너 */}
                  <View style={styles.timelineContainer}>
                    {/* 연속된 세로선 */}
                    <View style={styles.timelineLineWrapper}>
                      <View style={styles.timelineLine} />
                    </View>

                    {/* 장소 목록 */}
                    <View style={styles.placesWrapper}>
                      {dayPlaces.map((place) => {
                        const totalExpense = calculateExpenseTotal(place.expenses || []);
                        const displayMemos = post.memoDisplayType === 'MY_MEMO_ONLY'
                          ? (place.memos || []).filter((m) => m.author?.id === authUser?.id)
                          : (place.memos || []);

                        return (
                          <View key={place.id} style={styles.placeContainer}>
                            {/* 타임라인 점 */}
                            <View style={styles.timelineDot} />

                            {/* 장소 정보 */}
                            <View style={styles.placeContent}>
                              {/* 장소 이름 및 주소 */}
                              <View style={styles.placeHeader}>
                                <Text style={styles.placeName}>{place.name}</Text>
                                {place.address && (
                                  <Text style={styles.placeAddress}>{place.address}</Text>
                                )}
                              </View>

                              {/* 사진 */}
                              {(place.photos || []).length > 0 && (
                                <View style={styles.photosContainer}>
                                  {(place.photos || []).slice(0, 1).map((photo) => (
                                    <Image
                                      key={photo.id}
                                      source={{ uri: getFullImageUrl(photo.uri) }}
                                      style={styles.mainPhoto}
                                    />
                                  ))}
                                  {(place.photos || []).length > 1 && (
                                    <View style={styles.photoThumbnails}>
                                      {(place.photos || []).slice(1, 4).map((photo) => (
                                        <Image
                                          key={photo.id}
                                          source={{ uri: getFullImageUrl(photo.uri) }}
                                          style={styles.thumbnailPhoto}
                                        />
                                      ))}
                                    </View>
                                  )}
                                </View>
                              )}

                              {/* 지출 */}
                              {post.expenseDisplayType !== 'NONE' && (place.expenses || []).length > 0 && (
                                <View style={styles.expenseContainer}>
                                  <View style={styles.expenseHeader}>
                                    <Text style={styles.expenseLabel}>지출</Text>
                                    <Text style={styles.expenseTotal}>
                                      총 지출 {totalExpense}¥
                                    </Text>
                                  </View>
                                  {/* 상세 지출 내역 */}
                                  {post.expenseDisplayType === 'DETAIL' && (
                                    <View style={styles.expenseDetailList}>
                                      {(place.expenses || []).map((expense) => (
                                        <View key={expense.id} style={styles.expenseDetailItem}>
                                          <Text style={styles.expenseDetailAmount}>
                                            {expense.amount}{expense.currency || '¥'}
                                          </Text>
                                          <Text style={styles.expenseDetailTitle}>
                                            {expense.title}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                </View>
                              )}

                              {/* 메모 */}
                              {displayMemos.length > 0 && (
                                <View style={styles.memoContainer}>
                                  {displayMemos.map((memo) => (
                                    <Text key={memo.id} style={styles.memoText}>
                                      {memo.content}
                                    </Text>
                                  ))}
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 통계 */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={handleLike}>
            <Feather
              name={post.isLiked ? 'heart' : 'heart'}
              size={20}
              color={post.isLiked ? '#ff4444' : '#999'}
              fill={post.isLiked ? '#ff4444' : 'none'}
            />
            <Text style={[styles.statText, post.isLiked && styles.statTextActive]}>
              {post.likeCount}
            </Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Feather name="message-circle" size={20} color="#999" />
            <Text style={styles.statText}>{post.commentCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="eye" size={20} color="#999" />
            <Text style={styles.statText}>{post.viewCount}</Text>
          </View>
        </View>

        {/* 이 일정으로 계획하기 버튼 */}
        {showCopyButton && (
          <TouchableOpacity
            style={styles.copyPlanButton}
            onPress={() => setShowCopyConfirmModal(true)}
          >
            <MaterialIcons name="content-copy" size={20} color="#fff" />
            <Text style={styles.copyPlanButtonText}>이 일정으로 계획하기</Text>
          </TouchableOpacity>
        )}

        {/* 댓글 섹션 */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>댓글 {comments.length}</Text>

          {/* 댓글 목록 */}
          {comments.map((comment) => (
            <TravelPostCommentItem
              key={comment.id}
              comment={comment}
              currentUserId={authUser?.id}
              isAuthenticated={isAuthenticated}
              onLikePress={() => handleCommentLike(comment.id)}
              onReplyPress={() => setReplyingTo(comment.id)}
              onReportPress={() => handleCommentReportPress(comment.id)}
              showReplyInput={replyingTo === comment.id}
              onReplySubmit={handleCommentSubmit}
              onReplyCancel={() => setReplyingTo(null)}
            />
          ))}

          {/* 댓글 입력 */}
          <View style={styles.commentInputContainer}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              value={commentContent}
              onChangeText={setCommentContent}
              placeholder={isAuthenticated ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있습니다"}
              placeholderTextColor="#999"
              multiline
              onFocus={handleCommentInputFocus}
            />
            <TouchableOpacity
              style={[styles.commentSubmitButton, !commentContent.trim() && styles.commentSubmitButtonDisabled]}
              onPress={() => handleCommentSubmit()}
              disabled={!commentContent.trim() || isLoading}
            >
              <Text style={styles.commentSubmitText}>등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 로그인 필요 모달 */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <Pressable
          style={styles.loginModalOverlay}
          onPress={() => setShowLoginModal(false)}
        >
          <Pressable style={styles.loginModalContent} onPress={(e) => e.stopPropagation()}>
            <MaterialIcons name="lock-outline" size={48} color="#007AFF" />
            <Text style={styles.loginModalTitle}>로그인이 필요합니다</Text>
            <Text style={styles.loginModalSubtitle}>
              이 기능을 사용하려면 로그인해주세요
            </Text>
            <View style={styles.loginModalButtonRow}>
              <TouchableOpacity
                style={styles.loginModalCancelButton}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={styles.loginModalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginModalConfirmButton}
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/login');
                }}
              >
                <Text style={styles.loginModalConfirmText}>로그인</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 일정 복사 확인 모달 */}
      <Modal
        visible={showCopyConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCopyConfirmModal(false)}
      >
        <Pressable
          style={styles.loginModalOverlay}
          onPress={() => setShowCopyConfirmModal(false)}
        >
          <Pressable style={styles.copyConfirmModalContent} onPress={(e) => e.stopPropagation()}>
            <MaterialIcons name="content-copy" size={48} color="#088cda" />
            <Text style={styles.copyConfirmModalTitle}>일정 복사</Text>
            <Text style={styles.copyConfirmModalSubtitle}>
              이 여행기의 일정으로{'\n'}새로운 계획을 만드시겠습니까?
            </Text>
            <View style={styles.loginModalButtonRow}>
              <TouchableOpacity
                style={styles.loginModalCancelButton}
                onPress={() => setShowCopyConfirmModal(false)}
              >
                <Text style={styles.loginModalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginModalConfirmButton}
                onPress={() => {
                  setShowCopyConfirmModal(false);
                  setSelectedStartDate(null);
                  setShowDatePickerModal(true);
                }}
              >
                <Text style={styles.loginModalConfirmText}>다음</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <Pressable
          style={styles.loginModalOverlay}
          onPress={() => setShowDatePickerModal(false)}
        >
          <Pressable style={styles.datePickerModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.datePickerModalTitle}>여행 시작일 선택</Text>
            <Text style={styles.datePickerModalSubtitle}>
              {tripDays}일 여행이에요.{'\n'}시작일을 선택하면 종료일이 자동 설정됩니다.
            </Text>

            {/* 캘린더 */}
            <View style={styles.datePickerContainer}>
              <Calendar
                current={new Date().toISOString().split('T')[0]}
                minDate={new Date().toISOString().split('T')[0]}
                onDayPress={handleDayPress}
                markedDates={getMarkedDates}
                markingType="period"
                theme={{
                  backgroundColor: '#fff',
                  calendarBackground: '#fff',
                  textSectionTitleColor: '#9E9E9E',
                  selectedDayBackgroundColor: '#088CDA',
                  selectedDayTextColor: '#fff',
                  todayTextColor: '#176ADA',
                  dayTextColor: '#000',
                  textDisabledColor: '#E0E0E0',
                  monthTextColor: '#000',
                  textMonthFontSize: 18,
                  textMonthFontWeight: '600' as any,
                  textDayFontSize: 16,
                  textDayHeaderFontSize: 14,
                }}
              />
            </View>

            {/* 선택된 날짜 미리보기 */}
            {selectedStartDate && calculatedEndDate && (
              <View style={styles.datePreviewContainer}>
                <Text style={styles.datePreviewLabel}>여행 기간</Text>
                <Text style={styles.datePreviewText}>
                  {formatDateDisplayShort(selectedStartDate)} ~ {formatDateDisplayShort(calculatedEndDate)}
                </Text>
              </View>
            )}

            <View style={styles.loginModalButtonRow}>
              <TouchableOpacity
                style={styles.loginModalCancelButton}
                onPress={() => setShowDatePickerModal(false)}
              >
                <Text style={styles.loginModalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.loginModalConfirmButton,
                  (isCopying || !selectedStartDate) && styles.copyButtonDisabled
                ]}
                onPress={handleCopyPlan}
                disabled={isCopying || !selectedStartDate}
              >
                {isCopying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginModalConfirmText}>생성하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 여행기 신고 모달 */}
      <ReportModal
        visible={showReportModal}
        contentType="여행기"
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        isLoading={isLoading}
      />

      {/* 댓글 신고 모달 */}
      <ReportModal
        visible={showCommentReportModal}
        contentType="댓글"
        onClose={() => {
          setShowCommentReportModal(false);
          setReportingCommentId(null);
        }}
        onSubmit={handleCommentReport}
        isLoading={isLoading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reportButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  coverImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  content: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    marginBottom: 24,
  },
  travelPlanSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  destination: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  travelDate: {
    fontSize: 14,
    color: '#585858',
    marginBottom: 24,
  },
  // 일차별 일정 스타일
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dayDate: {
    fontSize: 12,
    color: '#585858',
  },
  timelineContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  timelineLineWrapper: {
    position: 'absolute',
    left: 3,
    top: 10,
    bottom: 10,
    width: 1,
    backgroundColor: '#C7C7C7',
  },
  timelineLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#C7C7C7',
  },
  placesWrapper: {
    flex: 1,
    paddingLeft: 20,
  },
  placeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -20,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7C7C7',
    zIndex: 1,
  },
  placeContent: {
    flex: 1,
  },
  placeHeader: {
    marginBottom: 8,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 12,
    color: '#585858',
  },
  photosContainer: {
    marginBottom: 8,
  },
  mainPhoto: {
    width: '100%',
    height: 182,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    marginBottom: 8,
  },
  photoThumbnails: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailPhoto: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
  },
  expenseContainer: {
    marginBottom: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  expenseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  expenseTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#585858',
  },
  expenseDetailList: {
    marginTop: 4,
  },
  expenseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  expenseDetailAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  expenseDetailTitle: {
    fontSize: 12,
    color: '#585858',
  },
  memoContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  memoText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#999',
  },
  statTextActive: {
    color: '#ff4444',
  },
  commentsSection: {
    marginTop: 8,
  },
  commentInputContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    gap: 8,
  },
  commentInput: {
    fontSize: 14,
    color: '#000',
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  commentSubmitButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#088cda',
    borderRadius: 8,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  commentSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // 로그인 모달 스타일
  loginModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  loginModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  loginModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginModalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  loginModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  loginModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  loginModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  loginModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // 일정 복사 버튼 스타일
  copyPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#088cda',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  copyPlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // 복사 확인 모달 스타일
  copyConfirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  copyConfirmModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  copyConfirmModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  // 날짜 선택 모달 스타일
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 380,
    alignItems: 'center',
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  datePickerModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  calendar: {
    width: '100%',
  },
  datePreviewContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  datePreviewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  datePreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#088cda',
  },
  copyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#088cda',
    fontWeight: '600',
  },
});

