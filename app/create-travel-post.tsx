import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../src/context/UserContext';
import { useTravelPost } from '../src/hooks/useTravelPost';
import { travelPlanApi, getFullImageUrl } from '../src/utils/travelPlanApi';
import type { TravelPlanFullDto } from '../src/utils/travelPlanApi';
import type {
  TravelPostVisibility,
  ExpenseDisplayType,
  MemoDisplayType,
  CreateTravelPostRequest,
  UpdateTravelPostRequest,
  TravelPost,
} from '../src/types/travelPost.types';

export default function CreateTravelPostScreen() {
  const insets = useSafeAreaInsets();
  const { planId: urlPlanId, editId } = useLocalSearchParams<{ planId?: string; editId?: string }>();
  const { authUser } = useUser();
  const { createTravelPost, updateTravelPost, getTravelPost, isLoading } = useTravelPost();

  // 수정 모드 여부
  const isEditMode = !!editId;
  const [existingPost, setExistingPost] = useState<TravelPost | null>(null);

  // 전체 여행 계획 데이터
  const [travelPlanData, setTravelPlanData] = useState<TravelPlanFullDto | null>(null);

  // 상태 관리
  const [title, setTitle] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const [visibility, setVisibility] = useState<TravelPostVisibility>('PUBLIC');
  const [expenseDisplayType, setExpenseDisplayType] = useState<ExpenseDisplayType>('TOTAL_ONLY');
  const [memoDisplayType, setMemoDisplayType] = useState<MemoDisplayType>('MY_MEMO_ONLY');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 모달 상태
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [selectedPlaceForPhoto, setSelectedPlaceForPhoto] = useState<{
    dayNumber: number;
    placeId: number
  } | null>(null);
  const [showSettingsBottomSheet, setShowSettingsBottomSheet] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<number | null>(null);

  // 수정 모드: 기존 여행기 로드
  useEffect(() => {
    if (!isEditMode || !editId) return;

    const loadExistingPost = async () => {
      setIsLoadingData(true);

      try {
        // 기존 여행기 데이터 로드
        const post = await getTravelPost(parseInt(editId));
        setExistingPost(post);
        setTitle(post.title);
        setVisibility(post.visibility);
        setExpenseDisplayType(post.expenseDisplayType);
        setMemoDisplayType(post.memoDisplayType);

        // 여행 계획 데이터도 로드
        if (post.travelPlanId) {
          const data = await travelPlanApi.getTravelPlanFull(post.travelPlanId, {
            includePhotos: true,
            includeExpenses: true,
            includeMemos: true,
          });
          setTravelPlanData(data);

          // 사진 ID 수집 (수정 모드에서는 모든 사진을 기본 선택)
          const allPhotoIds: number[] = [];
          data.days.forEach((day) => {
            day.places?.forEach((place) => {
              place.photos?.forEach((photo) => {
                if (photo.id) {
                  allPhotoIds.push(photo.id);
                }
              });
            });
          });
          setSelectedPhotoIds(allPhotoIds);
        }
      } catch (error) {
        console.error('Failed to load existing post:', error);
        Alert.alert('오류', '여행기 데이터를 불러오는데 실패했습니다.');
        router.back();
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingPost();
  }, [editId, isEditMode]);

  // 생성 모드: 여행 계획 전체 데이터 로드 (단일 API 호출)
  useEffect(() => {
    if (isEditMode || !urlPlanId) return;

    const loadTravelPlanData = async () => {
      setIsLoadingData(true);

      try {
        // 단일 API 호출로 모든 데이터 로드
        const data = await travelPlanApi.getTravelPlanFull(parseInt(urlPlanId), {
          includePhotos: true,
          includeExpenses: true,
          includeMemos: true,
        });

        setTravelPlanData(data);
        setTitle(data.title);

        // 모든 사진 ID 수집 (기본 선택)
        const allPhotoIds: number[] = [];
        data.days.forEach((day) => {
          day.places?.forEach((place) => {
            place.photos?.forEach((photo) => {
              if (photo.id) {
                allPhotoIds.push(photo.id);
              }
            });
          });
        });
        setSelectedPhotoIds(allPhotoIds);
      } catch (error) {
        console.error('Failed to load travel plan data:', error);
        Alert.alert('오류', '여행 계획 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadTravelPlanData();
  }, [urlPlanId, isEditMode]);

  // 날짜 포맷팅 (11월 20일)
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

  // 여행기 생성하기 버튼 클릭 - 공유 범위 선택 모달 표시
  const handleCreateButtonPress = () => {
    if (!travelPlanData) {
      Alert.alert('알림', '여행 계획을 찾을 수 없습니다.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }

    // 공유 범위 선택 모달 표시
    setShowVisibilityModal(true);
  };

  // 실제 여행기 생성/수정 (공유 범위 선택 후 호출)
  const handleCreatePost = async (selectedVisibility: TravelPostVisibility) => {
    if (!travelPlanData) return;

    try {
      if (isEditMode && existingPost) {
        // 수정 모드
        const request: UpdateTravelPostRequest = {
          title: title.trim(),
          visibility: selectedVisibility,
          expenseDisplayType,
          memoDisplayType,
          selectedPhotoIds,
        };

        const post = await updateTravelPost(existingPost.id, request);
        setCreatedPostId(post.id);
        setShowSuccessModal(true);
      } else {
        // 생성 모드
        const request: CreateTravelPostRequest = {
          travelPlanId: travelPlanData.id,
          title: title.trim(),
          visibility: selectedVisibility,
          expenseDisplayType,
          memoDisplayType,
          selectedPhotoIds,
        };

        const post = await createTravelPost(request);
        setCreatedPostId(post.id);
        setShowSuccessModal(true);
      }
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : isEditMode ? '여행기 수정에 실패했습니다.' : '여행기 생성에 실패했습니다.');
    }
  };

  if (isLoadingData || !travelPlanData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#088cda" />
        <Text style={styles.loadingText}>여행 계획을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 상단바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSettingsBottomSheet(true)}>
          <MaterialIcons name="more-horiz" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 제목 입력 */}
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="여행기 제목을 입력하세요"
          placeholderTextColor="#C7C7C7"
        />

        {/* 유저 프로필 */}
        <View style={styles.profileContainer}>
          <MaterialIcons name="account-circle" size={24} color="#C7C7C7" />
          <Text style={styles.usernameText}>{authUser?.username || 'Unknown User'}</Text>
        </View>

        {/* 여행 정보 */}
        <View style={styles.tripInfoContainer}>
          <Text style={styles.destination}>{travelPlanData.destination.name}</Text>
          <Text style={styles.dates}>
            {travelPlanData.startDate} - {travelPlanData.endDate}
          </Text>
        </View>

        {/* 일차별 타임라인 */}
        {travelPlanData.days.map((day, dayIndex) => {
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
                  {dayPlaces.map((place, placeIndex) => {
                    const totalExpense = calculateExpenseTotal(place.expenses || []);
                    const displayMemos = memoDisplayType === 'MY_MEMO_ONLY'
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
                                  {(place.photos || []).slice(1, 3).map((photo) => (
                                    <Image
                                      key={photo.id}
                                      source={{ uri: getFullImageUrl(photo.uri) }}
                                      style={styles.thumbnailPhoto}
                                    />
                                  ))}
                                  {(place.photos || []).length > 2 && (
                                    <TouchableOpacity
                                      style={styles.editPhotoButton}
                                      onPress={() => {
                                        setSelectedPlaceForPhoto({
                                          dayNumber: day.dayNumber,
                                          placeId: place.id
                                        });
                                        setShowPhotoPicker(true);
                                      }}
                                    >
                                      <MaterialIcons name="edit" size={16}
                                        color="#585858" />
                                      <Text style={styles.editPhotoText}>사진 편집</Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              )}
                            </View>
                          )}

                          {/* 지출 */}
                          {expenseDisplayType !== 'NONE' && (place.expenses || []).length > 0 && (
                            <View style={styles.expenseContainer}>
                              <View style={styles.expenseHeader}>
                                <Text style={styles.expenseLabel}>지출</Text>
                                <Text style={styles.expenseTotal}>
                                  총 지출 {totalExpense}¥
                                </Text>
                              </View>
                              {/* 상세 지출 내역 */}
                              {expenseDisplayType === 'DETAIL' && (
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
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!title.trim() || isLoading) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateButtonPress}
          disabled={!title.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>{isEditMode ? '여행기 수정하기' : '여행기 생성하기'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 설정 모달들 */}
      <ExpenseDisplayTypeModal
        visible={showExpenseModal}
        selected={expenseDisplayType}
        onSelect={setExpenseDisplayType}
        onClose={() => setShowExpenseModal(false)}
      />

      <MemoDisplayTypeModal
        visible={showMemoModal}
        selected={memoDisplayType}
        onSelect={setMemoDisplayType}
        onClose={() => setShowMemoModal(false)}
      />

      <VisibilityTypeModal
        visible={showVisibilityModal}
        selected={visibility}
        onSelect={(selectedVisibility) => {
          setVisibility(selectedVisibility);
          setShowVisibilityModal(false);
          handleCreatePost(selectedVisibility);
        }}
        onClose={() => setShowVisibilityModal(false)}
      />

      {/* 성공 모달 */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <Text style={styles.successModalText}>
              {isEditMode ? '여행기가 수정되었습니다.' : '여행기가 등록되었습니다.'}{'\n'}지금 확인하러 가볼까요?
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.back();
                }}
              >
                <Text style={styles.modalCancelButtonText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  if (createdPostId) {
                    router.push({
                      pathname: '/travel-post-detail',
                      params: { id: createdPostId.toString() }
                    });
                  }
                }}
              >
                <Text style={styles.modalConfirmButtonText}>보러가기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 하단 설정 시트 */}
      <Modal
        visible={showSettingsBottomSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsBottomSheet(false)}
      >
        <Pressable
          style={styles.bottomSheetOverlay}
          onPress={() => setShowSettingsBottomSheet(false)}
        >
          <View style={[styles.bottomSheetContent, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={styles.bottomSheetItem}
              onPress={() => {
                setShowSettingsBottomSheet(false);
                setTimeout(() => setShowExpenseModal(true), 300);
              }}
            >
              <Text style={styles.bottomSheetItemText}>지출 표기 범위 선택하기</Text>
            </TouchableOpacity>
            <View style={styles.bottomSheetDivider} />
            <TouchableOpacity
              style={styles.bottomSheetItem}
              onPress={() => {
                setShowSettingsBottomSheet(false);
                setTimeout(() => setShowMemoModal(true), 300);
              }}
            >
              <Text style={styles.bottomSheetItemText}>메모 표기 범위 선택하기</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// 지출 표기 범위 선택 모달
function ExpenseDisplayTypeModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: ExpenseDisplayType;
  onSelect: (type: ExpenseDisplayType) => void;
  onClose: () => void;
}) {
  const [tempSelected, setTempSelected] = useState<ExpenseDisplayType>(selected);

  useEffect(() => {
    if (visible) {
      setTempSelected(selected);
    }
  }, [visible, selected]);

  const options: { value: ExpenseDisplayType; label: string }[] = [
    { value: 'TOTAL_ONLY', label: '총 지출만 표시' },
    { value: 'DETAIL', label: '지출 상세 내역 포함' },
    { value: 'NONE', label: '지출 정보 표시 안 함' },
  ];

  const handleConfirm = () => {
    onSelect(tempSelected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>지출 표기 범위 선택하기</Text>
          <View style={styles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => setTempSelected(option.value)}
              >
                <View style={[
                  styles.checkbox,
                  tempSelected === option.value && styles.checkboxSelected
                ]}>
                  {tempSelected === option.value && (
                    <Feather name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelButtonText}>닫기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirm}>
              <Text style={styles.modalConfirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// 메모 표기 범위 선택 모달
function MemoDisplayTypeModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: MemoDisplayType;
  onSelect: (type: MemoDisplayType) => void;
  onClose: () => void;
}) {
  const [tempSelected, setTempSelected] = useState<MemoDisplayType>(selected);

  useEffect(() => {
    if (visible) {
      setTempSelected(selected);
    }
  }, [visible, selected]);

  const options: { value: MemoDisplayType; label: string }[] = [
    { value: 'MY_MEMO_ONLY', label: '내 메모만 표시' },
    { value: 'ALL_MEMOS', label: '동행자 메모 포함' },
  ];

  const handleConfirm = () => {
    onSelect(tempSelected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>메모 표기 범위 선택하기</Text>
          <View style={styles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => setTempSelected(option.value)}
              >
                <View style={[
                  styles.checkbox,
                  tempSelected === option.value && styles.checkboxSelected
                ]}>
                  {tempSelected === option.value && (
                    <Feather name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelButtonText}>닫기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirm}>
              <Text style={styles.modalConfirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// 공유 범위 선택 모달
function VisibilityTypeModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: TravelPostVisibility;
  onSelect: (type: TravelPostVisibility) => void;
  onClose: () => void;
}) {
  const [tempSelected, setTempSelected] = useState<TravelPostVisibility>(selected);

  useEffect(() => {
    if (visible) {
      setTempSelected(selected);
    }
  }, [visible, selected]);

  const options: { value: TravelPostVisibility; label: string; description?: string }[] = [
    {
      value: 'PUBLIC',
      label: '전체 공유',
      description: '모든 사용자에게 공개돼요\n검색이나 피드에 노출될 수 있어요',
    },
    { value: 'LINK_ONLY', label: '링크로만 공유' },
    { value: 'PRIVATE', label: '비공개' },
  ];

  const handleConfirm = () => {
    onSelect(tempSelected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>여행기 공유 범위 선택하기</Text>
            <Text style={styles.modalSubtitle}>여행기 생성 이후에도 변경할 수 있어요</Text>
          </View>
          <View style={styles.modalOptions}>
            {options.map((option) => (
              <View key={option.value} style={styles.modalOptionContainer}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => setTempSelected(option.value)}
                >
                  <View style={[
                    styles.checkbox,
                    tempSelected === option.value && styles.checkboxSelected
                  ]}>
                    {tempSelected === option.value && (
                      <Feather name="check" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
                {option.description && (
                  <Text style={styles.modalOptionDescription}>{option.description}</Text>
                )}
              </View>
            ))}
          </View>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelButtonText}>닫기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirm}>
              <Text style={styles.modalConfirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#585858',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 16,
    letterSpacing: -0.2,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  usernameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#585858',
  },
  tripInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  destination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
  },
  dates: {
    fontSize: 12,
    color: '#585858',
    letterSpacing: -0.15,
  },
  daySection: {
    marginBottom: 24,
    position: 'relative',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dayNumber: {
    fontSize: 16,
    color: '#000',
    letterSpacing: -0.2,
  },
  dayDate: {
    fontSize: 12,
    color: '#585858',
    letterSpacing: -0.15,
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
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 12,
    color: '#585858',
    letterSpacing: -0.15,
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
  editPhotoButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  editPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#585858',
    letterSpacing: -0.15,
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
    letterSpacing: -0.15,
  },
  expenseTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#585858',
    letterSpacing: -0.15,
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
    letterSpacing: -0.15,
  },
  expenseDetailTitle: {
    fontSize: 12,
    color: '#585858',
    letterSpacing: -0.15,
  },
  memoContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  memoText: {
    fontSize: 14,
    color: '#000',
    letterSpacing: -0.15,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  createButton: {
    backgroundColor: '#088CDA',
    paddingVertical: 12,
    paddingHorizontal: 57,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  successModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#585858',
    marginTop: 4,
  },
  modalOptions: {
    gap: 16,
    marginBottom: 24,
  },
  modalOptionContainer: {
    gap: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C7C7C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: '#088CDA',
    borderColor: '#088CDA',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#585858',
  },
  modalConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#088CDA',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalOptionDescription: {
    fontSize: 12,
    color: '#585858',
    marginLeft: 32,
    lineHeight: 18,
  },
  // 하단 시트 스타일
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },
  bottomSheetItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bottomSheetItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 20,
  },
});

