import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useUser, Expense, Memo } from '../src/context/UserContext';
import LocationBasedImagePicker from '../components/LocationBasedImagePicker';
import { getFullImageUrl } from '../src/utils/travelPlanApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PlaceDetailScreen() {
    const { planId, dayNumber, placeId } = useLocalSearchParams<{
        planId: string;
        dayNumber: string;
        placeId: string;
    }>();

    const { username, authUser, getTravelPlan, uploadPhotoToPlace, getPhotosByPlace, deletePhoto, reorderPhotos, updatePlaceMemo, deletePlaceFromDay, createExpense, getExpensesByPlace, updateExpense, deleteExpense, createMemo, getMemosByPlace, updateMemo, deleteMemo } = useUser();
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showMemoModal, setShowMemoModal] = useState(false);
    const [showMoreModal, setShowMoreModal] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string>('');
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
    const [isLoadingMemos, setIsLoadingMemos] = useState(false);
    const [selectedTime, setSelectedTime] = useState('');
    const [expenseType, setExpenseType] = useState<'PERSONAL' | 'SHARED'>('PERSONAL');
    const [expenseTitle, setExpenseTitle] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseMemo, setExpenseMemo] = useState('');
    const [expensePaidBy, setExpensePaidBy] = useState<string>('');
    const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [memoText, setMemoText] = useState('');
    const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
    const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
    const [selectedVisibility, setSelectedVisibility] = useState<'PERSONAL' | 'SHARED'>('SHARED');

    // 중복 로딩 방지를 위한 ref
    const isLoadingRef = useRef(false);
    const isLoadingExpensesRef = useRef(false);
    const isLoadingMemosRef = useRef(false);

    // 여행 데이터 및 장소 정보 가져오기
    const tripData = getTravelPlan(planId || '');
    const currentDay = tripData?.days.find(day => day.dayNumber === parseInt(dayNumber || '1'));
    const place = currentDay?.places.find(p => p.id === placeId);

    // 참가자 목록 (임시로 현재 사용자 + 더미 데이터)
    // TODO: 백엔드에서 실제 참가자 목록 가져오기
    const participants = [
        { id: authUser?.id.toString() || '1', name: username || '나' },
        { id: '2', name: '홍길동' },
        { id: '3', name: '김철수' },
    ];

    // 디버깅: place 데이터 확인
    useEffect(() => {
        console.log('🏷️ [place-detail] planId:', planId, 'dayNumber:', dayNumber, 'placeId:', placeId);
        console.log('🏷️ [place-detail] place found:', !!place);
        if (place) {
            console.log('🏷️ [place-detail] place.name:', place.name);
            console.log('🏷️ [place-detail] place.photos count:', place.photos?.length || 0);
            console.log('🏷️ [place-detail] place.photos:', JSON.stringify(place.photos, null, 2));
        }
    }, [place, planId, dayNumber, placeId]);

    // 사진 로드 함수
    const loadPhotos = async () => {
        if (!placeId || isLoadingRef.current) return;

        console.log('📸 [loadPhotos] Starting to load photos for placeId:', placeId);
        isLoadingRef.current = true;
        setIsLoadingPhotos(true);

        try {
            const photos = await getPhotosByPlace(placeId);
            console.log('📸 [loadPhotos] Loaded photos:', photos?.length || 0, 'photos');
            console.log('📸 [loadPhotos] Photo details:', JSON.stringify(photos, null, 2));
        } catch (error) {
            console.error('❌ [loadPhotos] Failed to load photos:', error);
            Alert.alert('오류', '사진을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoadingPhotos(false);
            isLoadingRef.current = false;
        }
    };

    // 지출 로드 함수
    const loadExpenses = async () => {
        if (!placeId || isLoadingExpensesRef.current) return;

        console.log('💰 [loadExpenses] Starting to load expenses for placeId:', placeId);
        isLoadingExpensesRef.current = true;
        setIsLoadingExpenses(true);

        try {
            const expenses = await getExpensesByPlace(placeId);
            console.log('💰 [loadExpenses] Loaded expenses:', expenses?.length || 0, 'expenses');
        } catch (error) {
            console.error('❌ [loadExpenses] Failed to load expenses:', error);
            Alert.alert('오류', '지출을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoadingExpenses(false);
            isLoadingExpensesRef.current = false;
        }
    };

    // 메모 로드 함수
    const loadMemos = async () => {
        if (!placeId || isLoadingMemosRef.current) return;

        console.log('📝 [loadMemos] Starting to load memos for placeId:', placeId);
        isLoadingMemosRef.current = true;
        setIsLoadingMemos(true);

        try {
            const memos = await getMemosByPlace(placeId);
            console.log('📝 [loadMemos] Loaded memos:', memos?.length || 0, 'memos');
        } catch (error) {
            console.error('❌ [loadMemos] Failed to load memos:', error);
            Alert.alert('오류', '메모를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoadingMemos(false);
            isLoadingMemosRef.current = false;
        }
    };

    // 화면 포커스될 때 사진, 지출, 메모 로드 (1회만)
    useFocusEffect(
        useCallback(() => {
            loadPhotos();
            loadExpenses();
            loadMemos();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [placeId]) // placeId가 변경될 때만 실행
    );

    // 목적지에 따른 통화 기호 반환
    const getCurrencySymbol = () => {
        const destination = tripData?.destination || '';

        if (destination.includes('일본') || destination.includes('도쿄') || destination.includes('오사카') || destination.includes('교토')) {
            return '¥';
        } else if (destination.includes('미국') || destination.includes('뉴욕') || destination.includes('LA')) {
            return '$';
        } else if (destination.includes('유럽') || destination.includes('파리') || destination.includes('런던') || destination.includes('독일')) {
            return '€';
        } else if (destination.includes('중국') || destination.includes('베이징') || destination.includes('상하이')) {
            return '¥';
        } else if (destination.includes('태국') || destination.includes('방콕')) {
            return '฿';
        } else if (destination.includes('베트남') || destination.includes('호치민') || destination.includes('하노이')) {
            return '₫';
        }

        return '₩'; // 기본값: 한국 원화
    };

    if (!tripData || !place) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#9E9E9E' }}>장소를 찾을 수 없습니다</Text>
                </View>
            </View>
        );
    }

    const handleBack = () => {
        router.back();
    };

    const handleMorePress = () => {
        setShowMoreModal(true);
    };

    const handleSelectPhotos = async (
        photoUris: string[],
        visibility: 'PERSONAL' | 'SHARED',
        orderedExistingPhotoIds: string[] // 기존 사진들의 새로운 순서
    ) => {
        if (planId && placeId) {
            try {
                console.log('📤 [handleSelectPhotos] Uploading', photoUris.length, 'photos with visibility:', visibility);
                console.log('📤 [handleSelectPhotos] Existing photo order:', orderedExistingPhotoIds);

                // 업로드된 사진 ID를 순서대로 저장
                const uploadedPhotoIds: string[] = [];

                for (const photoUri of photoUris) {
                    // visibility 파라미터 전달
                    const uploadedPhoto = await uploadPhotoToPlace(
                        planId,
                        parseInt(dayNumber || '1'),
                        placeId,
                        photoUri,
                        visibility,
                        undefined
                    );

                    // 업로드된 사진 ID 저장
                    if (uploadedPhoto) {
                        uploadedPhotoIds.push(uploadedPhoto.id);
                    }
                }

                // 사진 업로드 후 새로고침
                await loadPhotos();

                // 순서 업데이트: orderedExistingPhotoIds (사용자가 변경한 기존 사진 순서) + uploadedPhotoIds (새 사진)
                const newOrder = [...orderedExistingPhotoIds, ...uploadedPhotoIds];

                console.log('📤 [handleSelectPhotos] Final photo order:', newOrder, 'visibility:', visibility);

                // 순서 변경 또는 새 사진 업로드가 있으면 reorderPhotos 호출
                if (newOrder.length > 0) {
                    await reorderPhotos(placeId, visibility, newOrder);

                    // 순서 업데이트 후 다시 새로고침
                    await loadPhotos();
                }

                Alert.alert('완료', `사진이 ${visibility === 'SHARED' ? '공용' : '개인'} 앨범에 추가되었습니다.`);
            } catch (error) {
                console.error('Failed to add photos:', error);
                Alert.alert('오류', '사진 추가 중 오류가 발생했습니다.');
            }
        }
    };

    const handleDeletePhoto = (photoId: string) => {
        Alert.alert(
            '사진 삭제',
            '이 사진을 삭제하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePhoto(photoId);
                            // 사진 삭제 후 새로고침
                            await loadPhotos();
                            Alert.alert('완료', '사진이 삭제되었습니다.');
                        } catch (error) {
                            console.error('Failed to delete photo:', error);
                            Alert.alert('오류', '사진 삭제 중 오류가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handlePhotoPress = (photoUri: string) => {
        console.log('🖼️ [handlePhotoPress] photoUri:', photoUri);
        console.log('🖼️ [handlePhotoPress] showImageModal before:', showImageModal);
        setSelectedImageUri(photoUri);
        setShowImageModal(true);
        console.log('🖼️ [handlePhotoPress] Modal state updated');
    };

    const handleTimeAdd = () => {
        setShowTimeModal(true);
    };

    const handleExpenseAdd = (type: 'PERSONAL' | 'SHARED') => {
        setExpenseType(type);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseMemo('');
        setExpensePaidBy(authUser?.id.toString() || ''); // 기본값: 현재 사용자
        setShowPaidByDropdown(false);
        setEditingExpenseId(null);
        setShowExpenseModal(true);
    };

    const handleExpenseEdit = (expense: Expense) => {
        setExpenseType(expense.type);
        setExpenseTitle(expense.title);
        setExpenseAmount(expense.amount.toString());
        setExpenseMemo(expense.memo || '');
        setExpensePaidBy(expense.paidById);
        setShowPaidByDropdown(false);
        setEditingExpenseId(expense.id);
        setShowExpenseModal(true);
    };

    const handleExpenseSave = async () => {
        if (!planId || !placeId) return;

        if (!expenseTitle.trim()) {
            Alert.alert('오류', '지출 제목을 입력해주세요.');
            return;
        }

        if (!expenseAmount.trim() || isNaN(parseFloat(expenseAmount))) {
            Alert.alert('오류', '올바른 금액을 입력해주세요.');
            return;
        }

        if (expenseType === 'SHARED' && !expensePaidBy) {
            Alert.alert('오류', '지불한 사람을 선택해주세요.');
            return;
        }

        try {
            if (editingExpenseId) {
                // 수정
                await updateExpense(editingExpenseId, {
                    title: expenseTitle,
                    amount: parseFloat(expenseAmount),
                    type: expenseType,
                    memo: expenseMemo.trim() || undefined,
                });
                Alert.alert('완료', '지출이 수정되었습니다.');
            } else {
                // 생성
                await createExpense(
                    planId,
                    parseInt(dayNumber || '1'),
                    placeId,
                    {
                        title: expenseTitle,
                        amount: parseFloat(expenseAmount),
                        type: expenseType,
                        memo: expenseMemo.trim() || undefined,
                    }
                );
                Alert.alert('완료', `지출이 ${expenseType === 'SHARED' ? '공용' : '개인'} 지출에 추가되었습니다.`);
            }

            setShowExpenseModal(false);
            setShowPaidByDropdown(false);
            setEditingExpenseId(null);
            await loadExpenses();
        } catch (error) {
            console.error('Failed to save expense:', error);
            Alert.alert('오류', editingExpenseId ? '지출 수정 중 오류가 발생했습니다.' : '지출 추가 중 오류가 발생했습니다.');
        }
    };

    const handleExpenseDelete = (expenseId: string) => {
        Alert.alert(
            '지출 삭제',
            '이 지출을 삭제하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteExpense(expenseId);
                            await loadExpenses();
                            Alert.alert('완료', '지출이 삭제되었습니다.');
                        } catch (error) {
                            console.error('Failed to delete expense:', error);
                            Alert.alert('오류', '지출 삭제 중 오류가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    // 메모 추가/수정 모드 설정
    const handleMemoEdit = (memo: Memo) => {
        setMemoText(memo.content);
        setEditingMemoId(memo.id);
        setShowMemoModal(true);
    };

    // 메모 저장 핸들러 (생성 및 수정)
    const handleMemoSave = async () => {
        if (!memoText.trim()) {
            Alert.alert('알림', '메모 내용을 입력해주세요.');
            return;
        }

        try {
            if (editingMemoId) {
                // 수정 모드
                await updateMemo(editingMemoId, memoText.trim());
                setMemoText('');
                setEditingMemoId(null);
                setShowMemoModal(false);
                await loadMemos();
                Alert.alert('완료', '메모가 수정되었습니다.');
            } else {
                // 생성 모드
                await createMemo(placeId || '', memoText.trim());
                setMemoText('');
                setShowMemoModal(false);
                await loadMemos();
                Alert.alert('완료', '메모가 저장되었습니다.');
            }
        } catch (error) {
            console.error('Failed to save memo:', error);
            Alert.alert('오류', editingMemoId ? '메모 수정 중 오류가 발생했습니다.' : '메모 저장 중 오류가 발생했습니다.');
        }
    };

    // 메모 삭제 핸들러
    const handleMemoDelete = (memoId: string) => {
        setShowMemoModal(false); // 모달이 열려있으면 닫기
        Alert.alert(
            '메모 삭제',
            '이 메모를 삭제하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMemo(memoId);
                            await loadMemos();
                            Alert.alert('완료', '메모가 삭제되었습니다.');
                        } catch (error) {
                            console.error('Failed to delete memo:', error);
                            Alert.alert('오류', '메모 삭제 중 오류가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleSaveExpense = async () => {
        // TODO: 백엔드에 Expense Entity 구현 후 활성화
        Alert.alert('준비 중', '지출 기능은 현재 개발 중입니다.');
        // if (!expenseTitle.trim()) {
        //     Alert.alert('알림', '지출 제목을 입력해주세요.');
        //     return;
        // }

        // const amount = parseFloat(expenseAmount);
        // if (isNaN(amount) || amount <= 0) {
        //     Alert.alert('알림', '유효한 금액을 입력해주세요.');
        //     return;
        // }

        // if (planId && placeId) {
        //     try {
        //         await addExpenseToPlace(planId, parseInt(dayNumber || '1'), placeId, {
        //             title: expenseTitle,
        //             amount: amount,
        //             type: expenseType,
        //         });
        //         setShowExpenseModal(false);
        //         setExpenseTitle('');
        //         setExpenseAmount('');
        //     } catch (error) {
        //         console.error('Failed to add expense:', error);
        //         Alert.alert('오류', '지출 추가 중 오류가 발생했습니다.');
        //     }
        // }
    };

    const handleDeleteExpense = (expenseId: string) => {
        // TODO: 백엔드에 Expense Entity 구현 후 활성화
        Alert.alert('준비 중', '지출 기능은 현재 개발 중입니다.');
        // Alert.alert(
        //     '지출 삭제',
        //     '이 지출 내역을 삭제하시겠습니까?',
        //     [
        //         {
        //             text: '취소',
        //             style: 'cancel',
        //         },
        //         {
        //             text: '삭제',
        //             style: 'destructive',
        //             onPress: async () => {
        //                 if (planId && placeId) {
        //                     try {
        //                         await deleteExpenseFromPlace(planId, parseInt(dayNumber || '1'), placeId, expenseId);
        //                     } catch (error) {
        //                         console.error('Failed to delete expense:', error);
        //                         Alert.alert('오류', '지출 삭제 중 오류가 발생했습니다.');
        //                     }
        //                 }
        //             },
        //         },
        //     ]
        // );
    };

    const handleMemoAdd = () => {
        setMemoText('');
        setEditingMemoId(null);
        setShowMemoModal(true);
    };

    const handleDeletePlace = () => {
        setShowMoreModal(false);
        Alert.alert(
            '삭제 확인',
            `${place.name}을(를) 삭제하시겠습니까?`,
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제하기',
                    style: 'destructive',
                    onPress: async () => {
                        if (planId && placeId) {
                            try {
                                await deletePlaceFromDay(planId, parseInt(dayNumber || '1'), placeId);
                                router.back();
                            } catch (error) {
                                console.error('Failed to delete place:', error);
                                Alert.alert('오류', '장소 삭제 중 오류가 발생했습니다.');
                            }
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleMorePress} style={styles.moreButton}>
                    <Feather name="more-horizontal" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 날짜 및 카메라 */}
                <View style={styles.dateRow}>
                    <View style={styles.dateInfo}>
                        <Text style={styles.dayNumber}>{dayNumber}일차</Text>
                        <Text style={styles.dateText}>{currentDay?.displayDate}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert('사진 추가', '어떤 앨범에 추가하시겠습니까?', [
                                { text: '취소', style: 'cancel' },
                                {
                                    text: '개인 앨범',
                                    onPress: () => {
                                        setSelectedVisibility('PERSONAL');
                                        setShowImagePicker(true);
                                    },
                                },
                                {
                                    text: '공유 앨범',
                                    onPress: () => {
                                        setSelectedVisibility('SHARED');
                                        setShowImagePicker(true);
                                    },
                                },
                            ]);
                        }}
                        style={styles.cameraButton}
                    >
                        <MaterialIcons name="photo-camera" size={32} color="#585858" />
                    </TouchableOpacity>
                </View>

                {/* 장소 정보 */}
                <View style={styles.placeInfoSection}>
                    <View style={styles.placeNameContainer}>
                        <Text style={styles.placeName}>{place.name}</Text>
                        {place.address && (
                            <Text style={styles.placeAddress}>{place.address}</Text>
                        )}
                    </View>

                    {/* 운영시간 (임시 데이터) */}
                    {place.time && (
                        <Text style={styles.operatingHours}>{place.time}</Text>
                    )}

                    {/* 시간 추가/편집 */}
                    {place.time ? (
                        <View style={styles.timeRow}>
                            <View style={styles.timeInfo}>
                                <MaterialIcons name="access-time" size={16} color="#585858" />
                                <Text style={styles.timeText}>{place.time}</Text>
                            </View>
                            <TouchableOpacity onPress={handleTimeAdd}>
                                <Text style={styles.editText}>편집</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addButton} onPress={handleTimeAdd}>
                            <Feather name="plus" size={12} color="#fff" />
                            <Text style={styles.addButtonText}>시간 추가</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 구분선 */}
                <View style={styles.divider} />

                {/* 개인 앨범 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>개인 앨범</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.photoSection}
                        contentContainerStyle={styles.photoSectionContent}
                    >
                        {/* PERSONAL 사진만 필터링 후 orderIndex로 정렬 */}
                        {place.photos
                            ?.filter((photo) => photo.visibility === 'PERSONAL')
                            .sort((a, b) => {
                                // orderIndex가 있으면 그것으로 정렬, 없으면 timestamp로 정렬
                                if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                                    return a.orderIndex - b.orderIndex;
                                }
                                // orderIndex가 없으면 timestamp로 정렬 (최신순)
                                return new Date(b.timestamp || b.uploadedAt).getTime() - new Date(a.timestamp || a.uploadedAt).getTime();
                            })
                            .map((photo) => {
                                const fullImageUrl = getFullImageUrl(photo.uri);
                                const fullThumbnailUrl = getFullImageUrl(photo.thumbnailUri);
                                const hasError = failedImageIds.has(photo.id);
                                return (
                                    <TouchableOpacity
                                        key={photo.id}
                                        style={styles.photoContainer}
                                        onPress={() => handlePhotoPress(fullImageUrl)}
                                        onLongPress={() => handleDeletePhoto(photo.id)}
                                    >
                                        <Image
                                            source={{ uri: fullThumbnailUrl }}
                                            style={styles.photoThumbnail}
                                            onLoad={() => {
                                                setFailedImageIds((prev) => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(photo.id);
                                                    return newSet;
                                                });
                                            }}
                                            onError={() => {
                                                setFailedImageIds((prev) => new Set(prev).add(photo.id));
                                            }}
                                        />
                                        {hasError && (
                                            <View style={styles.photoErrorOverlay}>
                                                <Feather name="image" size={32} color="#C7C7C7" />
                                                <Text style={styles.photoErrorText}>403</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={styles.deletePhotoButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleDeletePhoto(photo.id);
                                            }}
                                        >
                                            <Feather name="x" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            })}
                    </ScrollView>
                    {/* 사진 편집 버튼 (개인) */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                            setSelectedVisibility('PERSONAL');
                            setShowImagePicker(true);
                        }}
                    >
                        <Feather name="plus" size={12} color="#fff" />
                        <Text style={styles.addButtonText}>사진 편집</Text>
                    </TouchableOpacity>
                </View>

                {/* 공유한 앨범 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>공유한 앨범</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.photoSection}
                        contentContainerStyle={styles.photoSectionContent}
                    >
                        {/* SHARED 사진만 필터링 후 orderIndex로 정렬 */}
                        {place.photos
                            ?.filter((photo) => photo.visibility === 'SHARED')
                            .sort((a, b) => {
                                // orderIndex가 있으면 그것으로 정렬, 없으면 timestamp로 정렬
                                if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                                    return a.orderIndex - b.orderIndex;
                                }
                                // orderIndex가 없으면 timestamp로 정렬 (최신순)
                                return new Date(b.timestamp || b.uploadedAt).getTime() - new Date(a.timestamp || a.uploadedAt).getTime();
                            })
                            .map((photo) => {
                                const fullImageUrl = getFullImageUrl(photo.uri);
                                const fullThumbnailUrl = getFullImageUrl(photo.thumbnailUri);
                                const hasError = failedImageIds.has(photo.id);
                                return (
                                    <TouchableOpacity
                                        key={photo.id}
                                        style={styles.photoContainer}
                                        onPress={() => handlePhotoPress(fullImageUrl)}
                                        onLongPress={() => handleDeletePhoto(photo.id)}
                                    >
                                        <Image
                                            source={{ uri: fullThumbnailUrl }}
                                            style={styles.photoThumbnail}
                                            onLoad={() => {
                                                setFailedImageIds((prev) => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(photo.id);
                                                    return newSet;
                                                });
                                            }}
                                            onError={() => {
                                                setFailedImageIds((prev) => new Set(prev).add(photo.id));
                                            }}
                                        />
                                        {hasError && (
                                            <View style={styles.photoErrorOverlay}>
                                                <Feather name="image" size={32} color="#C7C7C7" />
                                                <Text style={styles.photoErrorText}>403</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={styles.deletePhotoButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleDeletePhoto(photo.id);
                                            }}
                                        >
                                            <Feather name="x" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            })}
                    </ScrollView>
                    {/* 사진 편집 버튼 (공유) */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                            setSelectedVisibility('SHARED');
                            setShowImagePicker(true);
                        }}
                    >
                        <Feather name="plus" size={12} color="#fff" />
                        <Text style={styles.addButtonText}>사진 편집</Text>
                    </TouchableOpacity>
                </View>

                {/* 구분선 */}
                <View style={styles.divider} />

                {/* 개인 지출 섹션 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>개인 지출</Text>
                        {(place.expenses?.filter(expense => expense.type === 'PERSONAL').length ?? 0) > 0 && (
                            <Text style={styles.totalAmount}>
                                총 지출 {(place.expenses ?? [])
                                    .filter(expense => expense.type === 'PERSONAL')
                                    .reduce((sum, expense) => sum + expense.amount, 0)
                                    .toLocaleString()}{getCurrencySymbol()}
                            </Text>
                        )}
                    </View>

                    {/* 저장된 개인 지출 목록 */}
                    {(place.expenses?.filter(expense => expense.type === 'PERSONAL').length ?? 0) > 0 ? (
                        <View style={styles.expenseList}>
                            {(place.expenses ?? [])
                                .filter(expense => expense.type === 'PERSONAL')
                                .map((expense) => (
                                    <TouchableOpacity
                                        key={expense.id}
                                        style={styles.expenseItem}
                                        onPress={() => handleExpenseEdit(expense)}
                                        onLongPress={() => handleExpenseDelete(expense.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.expenseAmountText}>
                                            {expense.amount.toLocaleString()}{getCurrencySymbol()}
                                        </Text>
                                        <Text style={styles.expenseTitleText} numberOfLines={1} ellipsizeMode="tail">
                                            {expense.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    ) : null}

                    <TouchableOpacity style={styles.addButton} onPress={() => handleExpenseAdd('PERSONAL')}>
                        <Feather name="plus" size={12} color="#fff" />
                        <Text style={styles.addButtonText}>지출 추가</Text>
                    </TouchableOpacity>
                </View>

                {/* 공용 지출 섹션 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>공용 지출</Text>
                        {(place.expenses?.filter(expense => expense.type === 'SHARED').length ?? 0) > 0 && (
                            <Text style={styles.totalAmount}>
                                총 지출 {(place.expenses ?? [])
                                    .filter(expense => expense.type === 'SHARED')
                                    .reduce((sum, expense) => sum + expense.amount, 0)
                                    .toLocaleString()}{getCurrencySymbol()}
                            </Text>
                        )}
                    </View>

                    {/* 저장된 공용 지출 목록 */}
                    {(place.expenses?.filter(expense => expense.type === 'SHARED').length ?? 0) > 0 ? (
                        <View style={styles.expenseList}>
                            {(place.expenses ?? [])
                                .filter(expense => expense.type === 'SHARED')
                                .map((expense) => (
                                    <TouchableOpacity
                                        key={expense.id}
                                        style={styles.expenseItemContainer}
                                        onPress={() => handleExpenseEdit(expense)}
                                        onLongPress={() => handleExpenseDelete(expense.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.expenseItem}>
                                            <Text style={styles.expenseAmountText}>
                                                {expense.amount.toLocaleString()}{getCurrencySymbol()}
                                            </Text>
                                            <View style={styles.expenseTitleContainer}>
                                                <Text style={styles.expenseTitleText} numberOfLines={1} ellipsizeMode="tail">
                                                    {expense.title}
                                                </Text>
                                                {expense.memo && (
                                                    <Text style={styles.expenseMemoText} numberOfLines={1} ellipsizeMode="tail">
                                                        {expense.memo}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    ) : null}

                    <TouchableOpacity style={styles.addButton} onPress={() => handleExpenseAdd('SHARED')}>
                        <Feather name="plus" size={12} color="#fff" />
                        <Text style={styles.addButtonText}>지출 추가</Text>
                    </TouchableOpacity>
                </View>

                {/* 구분선 */}
                <View style={styles.divider} />

                {/* 메모 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>메모</Text>

                    {/* 저장된 메모 목록 */}
                    {(place.memos && place.memos.length > 0) && (
                        <View style={styles.memoList}>
                            {place.memos.map((memo) => (
                                <TouchableOpacity
                                    key={memo.id}
                                    style={styles.memoItemContainer}
                                    onPress={() => handleMemoEdit(memo)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="account-circle" size={24} color="#C7C7C7" />
                                    <View style={styles.memoContentContainer}>
                                        <Text style={styles.memoUserName}>{memo.author.username}</Text>
                                        <Text style={styles.memoContentText} numberOfLines={1} ellipsizeMode="tail">
                                            {memo.content}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* 메모 추가 버튼 */}
                    <TouchableOpacity style={styles.addButton} onPress={handleMemoAdd}>
                        <Feather name="plus" size={12} color="#fff" />
                        <Text style={styles.addButtonText}>메모 추가</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* 더보기 모달 (삭제하기) */}
            <Modal
                visible={showMoreModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMoreModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMoreModal(false)}
                >
                    <View style={styles.bottomSheet}>
                        <TouchableOpacity
                            style={styles.bottomSheetOption}
                            onPress={handleDeletePlace}
                        >
                            <Text style={styles.deleteText}>삭제하기</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 시간 추가 모달 */}
            <Modal
                visible={showTimeModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTimeModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTimeModal(false)}
                >
                    <View style={styles.timeModalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>시간 추가</Text>
                        <TextInput
                            style={styles.timeInput}
                            placeholder="예: 오후 3시 30분"
                            placeholderTextColor="#9E9E9E"
                            value={selectedTime}
                            onChangeText={setSelectedTime}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                                <Text style={styles.modalCancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    // TODO: 시간 저장 구현
                                    console.log('Save time:', selectedTime);
                                    setShowTimeModal(false);
                                    Alert.alert('안내', '시간 저장 기능은 추후 구현 예정입니다.');
                                }}
                            >
                                <Text style={styles.modalConfirmText}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 지출 추가 모달 */}
            <Modal
                visible={showExpenseModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowExpenseModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setShowExpenseModal(false);
                        setShowPaidByDropdown(false);
                    }}
                >
                    <View style={styles.expenseModalContent} onStartShouldSetResponder={() => true}>
                        {/* 상단 헤더 (제목 + X 버튼) */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {expenseType === 'PERSONAL' ? '개인' : '공용'} 지출 {editingExpenseId ? '수정' : '추가'}
                            </Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => {
                                    setShowExpenseModal(false);
                                    setShowPaidByDropdown(false);
                                    setEditingExpenseId(null);
                                }}
                            >
                                <Feather name="x" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>지출 제목</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="예: 신주쿠 교엔 입장권"
                                placeholderTextColor="#9E9E9E"
                                value={expenseTitle}
                                onChangeText={setExpenseTitle}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>금액</Text>
                            <View style={styles.amountInputContainer}>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="금액을 입력하세요"
                                    placeholderTextColor="#9E9E9E"
                                    keyboardType="numeric"
                                    value={expenseAmount}
                                    onChangeText={setExpenseAmount}
                                />
                                <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
                            </View>
                        </View>

                        {/* 공용 지출일 때만 지불한 사람 선택 */}
                        {expenseType === 'SHARED' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>지불한 사람</Text>
                                <TouchableOpacity
                                    style={styles.dropdown}
                                    onPress={() => setShowPaidByDropdown(!showPaidByDropdown)}
                                >
                                    <Text style={styles.dropdownText}>
                                        {expensePaidBy
                                            ? participants.find(p => p.id === expensePaidBy)?.name || '선택하세요'
                                            : '선택하세요'}
                                    </Text>
                                    <Feather
                                        name={showPaidByDropdown ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#585858"
                                    />
                                </TouchableOpacity>

                                {showPaidByDropdown && (
                                    <View style={styles.dropdownList}>
                                        {participants.map((participant) => (
                                            <TouchableOpacity
                                                key={participant.id}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setExpensePaidBy(participant.id);
                                                    setShowPaidByDropdown(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.dropdownItemText,
                                                    expensePaidBy === participant.id && styles.dropdownItemTextSelected
                                                ]}>
                                                    {participant.name}
                                                </Text>
                                                {expensePaidBy === participant.id && (
                                                    <Feather name="check" size={16} color="#088CDA" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            {editingExpenseId ? (
                                // 수정 모드: 삭제 + 확인
                                <>
                                    <TouchableOpacity onPress={() => {
                                        setShowExpenseModal(false);
                                        setShowPaidByDropdown(false);
                                        handleExpenseDelete(editingExpenseId);
                                    }}>
                                        <Text style={styles.modalDeleteText}>삭제</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleExpenseSave}>
                                        <Text style={styles.modalConfirmText}>확인</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                // 추가 모드: 확인만
                                <TouchableOpacity onPress={handleExpenseSave} style={{ marginLeft: 'auto' }}>
                                    <Text style={styles.modalConfirmText}>확인</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 메모 추가 모달 */}
            <Modal
                visible={showMemoModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowMemoModal(false);
                    setEditingMemoId(null);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setShowMemoModal(false);
                        setEditingMemoId(null);
                    }}
                >
                    <View style={styles.memoModalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.memoInputContainer}>
                            <TextInput
                                style={styles.memoTextInput}
                                placeholder="메모를 입력하세요"
                                placeholderTextColor="#9E9E9E"
                                multiline
                                textAlignVertical="top"
                                value={memoText}
                                onChangeText={setMemoText}
                            />
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => {
                                setShowMemoModal(false);
                                setEditingMemoId(null);
                                setMemoText('');
                            }}>
                                <Text style={styles.modalCancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleMemoSave}>
                                <Text style={styles.memoConfirmText}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 위치 기반 이미지 피커 */}
            <LocationBasedImagePicker
                visible={showImagePicker}
                onClose={() => setShowImagePicker(false)}
                onSelectPhotos={handleSelectPhotos}
                placeLatitude={place?.latitude}
                placeLongitude={place?.longitude}
                placeName={place?.name || '장소'}
                initialVisibility={selectedVisibility}
                hideVisibilitySelector={true}
                existingPhotos={
                    place?.photos
                        ?.filter((photo) => photo.visibility === selectedVisibility)
                        .sort((a, b) => {
                            // orderIndex가 있으면 그것으로 정렬, 없으면 timestamp로 정렬
                            if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                                return a.orderIndex - b.orderIndex;
                            }
                            return 0;
                        })
                        .map((photo) => ({
                            id: photo.id, // Photo ID (백엔드 DB ID)
                            filename: photo.filename, // 원본 파일명
                            orderIndex: photo.orderIndex, // 기존 순서
                        })) || []
                }
            />

            {/* 이미지 뷰어 모달 */}
            <Modal
                visible={showImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    console.log('🖼️ [Modal] onRequestClose');
                    setShowImageModal(false);
                }}
                onShow={() => console.log('🖼️ [Modal] onShow - selectedImageUri:', selectedImageUri)}
            >
                <View style={styles.imageModalContainer}>
                    <TouchableOpacity
                        style={styles.imageModalCloseArea}
                        activeOpacity={1}
                        onPress={() => {
                            console.log('🖼️ [Modal] Close button pressed');
                            setShowImageModal(false);
                        }}
                    >
                        <View style={styles.imageModalHeader}>
                            <TouchableOpacity
                                onPress={() => {
                                    console.log('🖼️ [Modal] X button pressed');
                                    setShowImageModal(false);
                                }}
                                style={styles.imageModalCloseButton}
                            >
                                <Feather name="x" size={32} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                    <Image
                        source={{ uri: selectedImageUri }}
                        style={styles.fullSizeImage}
                        resizeMode="contain"
                        onLoad={() => console.log('✅ [Modal Image] Loaded successfully')}
                        onError={(error) => console.error('❌ [Modal Image] Load error:', error.nativeEvent.error)}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 8,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 24,
        height: 24,
    },
    moreButton: {
        width: 24,
        height: 24,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 8,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dayNumber: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    dateText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#585858',
    },
    cameraButton: {
        width: 32,
        height: 32,
    },
    placeInfoSection: {
        marginBottom: 24,
    },
    placeNameContainer: {
        marginBottom: 8,
    },
    placeName: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        marginBottom: 4,
    },
    placeAddress: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    operatingHours: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
        marginBottom: 8,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    editText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    addButton: {
        backgroundColor: '#C7C7C7',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 5,
        paddingVertical: 4,
        height: 24,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    addButtonText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
    },
    photoSection: {
        marginTop: 12,
        marginBottom: 24,
    },
    photoSectionContent: {
        gap: 8,
        paddingRight: 20,
    },
    photoContainer: {
        position: 'relative',
    },
    photoThumbnail: {
        width: 106,
        height: 106,
        borderRadius: 16,
        backgroundColor: '#F6F6F6',
    },
    photoErrorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(246, 246, 246, 0.9)',
        borderRadius: 16,
    },
    photoErrorText: {
        fontSize: 12,
        color: '#C7C7C7',
        marginTop: 4,
        fontWeight: '600',
    },
    personalBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deletePhotoButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoButton: {
        width: 106,
        height: 106,
        borderRadius: 15,
        backgroundColor: '#F6F6F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 16,
        backgroundColor: '#F6F6F6',
        marginHorizontal: -20,
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    totalAmount: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        letterSpacing: -0.2,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    bottomSheetOption: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    deleteText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#FF3B30',
    },
    timeModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 53,
        marginTop: 'auto',
        marginBottom: 'auto',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    modalCloseButton: {
        padding: 4,
    },
    timeInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingVertical: 8,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 192,
        alignSelf: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#585858',
        fontWeight: '600',
    },
    modalDeleteText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#FF3B30',
        fontWeight: '600',
    },
    modalConfirmText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#088CDA',
        fontWeight: '600',
    },
    expenseModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 53,
        marginTop: 'auto',
        marginBottom: 'auto',
    },
    expenseTypeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    expenseTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expenseTypeButtonText: {
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: -0.18,
        color: '#000',
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        marginBottom: 16,
    },
    modalInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingVertical: 8,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    memoInput: {
        minHeight: 80,
        paddingTop: 12,
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingVertical: 12,
    },
    dropdownText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    dropdownList: {
        marginTop: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dropdownItemText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    dropdownItemTextSelected: {
        color: '#088CDA',
        fontWeight: '600',
    },
    memoModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 53,
        marginTop: 'auto',
        marginBottom: 'auto',
        gap: 32,
    },
    memoInputContainer: {
        backgroundColor: '#F6F6F6',
        borderRadius: 8,
        padding: 8,
        height: 80,
    },
    memoTextInput: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.175,
        color: '#000',
        fontFamily: 'Pretendard',
    },
    memoConfirmText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#088CDA',
        fontWeight: '600',
    },
    expenseList: {
        marginBottom: 12,
        gap: 8,
    },
    expenseItemContainer: {
        marginBottom: 4,
    },
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    expenseAmountText: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        minWidth: 80,
    },
    expenseTitleContainer: {
        flex: 1,
    },
    expenseTitleText: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    expenseMemoText: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        letterSpacing: -0.2,
        color: '#666',
        marginTop: 2,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingVertical: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        padding: 0,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#585858',
        marginLeft: 8,
    },
    memoList: {
        gap: 8,
        marginTop: 16,
        marginBottom: 16,
    },
    memoItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    memoContentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        overflow: 'hidden',
    },
    memoUserName: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.175,
        color: '#000',
        fontWeight: '700',
        flexShrink: 0,
        minWidth: 48,
    },
    memoContentText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.175,
        color: '#585858',
    },
    imageModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalCloseArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    imageModalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
    },
    imageModalCloseButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullSizeImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
});

