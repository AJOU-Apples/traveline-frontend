import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../src/context/UserContext';
import LocationBasedImagePicker from '../components/LocationBasedImagePicker';
import { getFullImageUrl } from '../src/utils/travelPlanApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PlaceDetailScreen() {
    const { planId, dayNumber, placeId } = useLocalSearchParams<{
        planId: string;
        dayNumber: string;
        placeId: string;
    }>();

    const { username, getTravelPlan, uploadPhotoToPlace, getPhotosByPlace, deletePhoto, reorderPhotos, updatePlaceMemo, deletePlaceFromDay } = useUser();
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showMemoModal, setShowMemoModal] = useState(false);
    const [showMoreModal, setShowMoreModal] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string>('');
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
    const [selectedTime, setSelectedTime] = useState('');
    const [expenseType, setExpenseType] = useState<'personal' | 'shared'>('personal');
    const [expenseTitle, setExpenseTitle] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [memoText, setMemoText] = useState('');
    const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
    const [selectedVisibility, setSelectedVisibility] = useState<'PERSONAL' | 'SHARED'>('SHARED');

    // 중복 로딩 방지를 위한 ref
    const isLoadingRef = useRef(false);

    // 여행 데이터 및 장소 정보 가져오기
    const tripData = getTravelPlan(planId || '');
    const currentDay = tripData?.days.find(day => day.dayNumber === parseInt(dayNumber || '1'));
    const place = currentDay?.places.find(p => p.id === placeId);

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

    // 화면 포커스될 때 사진 로드 (1회만)
    useFocusEffect(
        useCallback(() => {
            loadPhotos();
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

    const handleExpenseAdd = () => {
        // TODO: 백엔드에 Expense Entity 구현 후 활성화
        Alert.alert('준비 중', '지출 기능은 현재 개발 중입니다.');
        // setExpenseType('personal');
        // setExpenseTitle('');
        // setExpenseAmount('');
        // setShowExpenseModal(true);
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
        setMemoText(place?.memo || '');
        setShowMemoModal(true);
    };

    const handleSaveMemo = async () => {
        if (planId && placeId) {
            try {
                await updatePlaceMemo(planId, parseInt(dayNumber || '1'), placeId, memoText);
                setShowMemoModal(false);
            } catch (error) {
                console.error('Failed to save memo:', error);
                Alert.alert('오류', '메모 저장 중 오류가 발생했습니다.');
            }
        }
    };

    const handleDeleteMemo = async () => {
        if (planId && placeId) {
            try {
                await updatePlaceMemo(planId, parseInt(dayNumber || '1'), placeId, '');
                setMemoText('');
                setShowMemoModal(false);
            } catch (error) {
                console.error('Failed to delete memo:', error);
                Alert.alert('오류', '메모 삭제 중 오류가 발생했습니다.');
            }
        }
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

                {/* 지출 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>지출</Text>

                    {/* 저장된 지출 목록 */}
                    {place.expenses && place.expenses.length > 0 && (
                        <View style={styles.expenseList}>
                            {place.expenses.map((expense) => (
                                <TouchableOpacity
                                    key={expense.id}
                                    style={styles.expenseItem}
                                    onLongPress={() => handleDeleteExpense(expense.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.expenseTypeText}>
                                        {expense.type === 'personal' ? '개인' : '공동'}
                                    </Text>
                                    <Text style={styles.expenseAmountText}>
                                        {expense.amount.toLocaleString()}{getCurrencySymbol()}
                                    </Text>
                                    <Text style={styles.expenseTitleText}>
                                        {expense.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.addButton} onPress={handleExpenseAdd}>
                        <Feather name="plus" size={12} color="#fff" />
                        <Text style={styles.addButtonText}>지출 추가</Text>
                    </TouchableOpacity>
                </View>

                {/* 구분선 */}
                <View style={styles.divider} />

                {/* 메모 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>메모</Text>

                    {/* 저장된 메모 표시 */}
                    {place.memo && place.memo.trim() !== '' && (
                        <TouchableOpacity
                            style={styles.memoItemContainer}
                            onPress={handleMemoAdd}
                            activeOpacity={0.7}
                        >
                            <View style={styles.memoUserInfo}>
                                <MaterialIcons name="account-circle" size={24} color="#C7C7C7" />
                                <Text style={styles.memoUserName}>{username}</Text>
                            </View>
                            <Text style={styles.memoContentText} numberOfLines={1} ellipsizeMode="tail">
                                {place.memo}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* 메모 추가/편집 버튼 */}
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
                    onPress={() => setShowExpenseModal(false)}
                >
                    <View style={styles.expenseModalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.expenseTypeRow}>
                            <TouchableOpacity
                                style={styles.expenseTypeButton}
                                onPress={() => setExpenseType('personal')}
                            >
                                <MaterialIcons
                                    name={expenseType === 'personal' ? "check-box" : "check-box-outline-blank"}
                                    size={24}
                                    color={expenseType === 'personal' ? "#088CDA" : "#C7C7C7"}
                                />
                                <Text style={styles.expenseTypeButtonText}>개인</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.expenseTypeButton}
                                onPress={() => setExpenseType('shared')}
                            >
                                <MaterialIcons
                                    name={expenseType === 'shared' ? "check-box" : "check-box-outline-blank"}
                                    size={24}
                                    color={expenseType === 'shared' ? "#088CDA" : "#C7C7C7"}
                                />
                                <Text style={styles.expenseTypeButtonText}>공동</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>지출 제목</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="예: 신주큐 교엔 스타벅스 카페라떼"
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

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                                <Text style={styles.modalCancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveExpense}>
                                <Text style={styles.modalConfirmText}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 메모 추가 모달 */}
            <Modal
                visible={showMemoModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMemoModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMemoModal(false)}
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
                            <TouchableOpacity onPress={handleDeleteMemo}>
                                <Text style={styles.modalCancelText}>삭제하기</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveMemo}>
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
    },
    addButtonText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
    },
    photoSection: {
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        marginBottom: 8,
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
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        marginBottom: 16,
        textAlign: 'center',
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
    modalConfirmText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
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
        marginBottom: 8,
        gap: 4,
    },
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingVertical: 2,
    },
    expenseTypeText: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#088CDA',
        width: 50,
    },
    expenseAmountText: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        width: 100,
        textAlign: 'left',
        marginRight: 12,
    },
    expenseTitleText: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        flex: 1,
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
    memoItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 8,
    },
    memoUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        width: 110,
    },
    memoUserName: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.175,
        color: '#000',
        fontWeight: '500',
    },
    memoContentText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.175,
        color: '#000',
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

