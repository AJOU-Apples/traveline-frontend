import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, Modal, TextInput, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../src/context/UserContext';
import * as ImagePicker from 'expo-image-picker';

export default function PlaceDetailScreen() {
    const { planId, dayNumber, placeId } = useLocalSearchParams<{
        planId: string;
        dayNumber: string;
        placeId: string;
    }>();

    const { getTravelPlan, addPhotoToPlace, deletePhotoFromPlace, addExpenseToPlace, deleteExpenseFromPlace } = useUser();
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showMemoModal, setShowMemoModal] = useState(false);
    const [showMoreModal, setShowMoreModal] = useState(false);
    const [selectedTime, setSelectedTime] = useState('');
    const [expenseType, setExpenseType] = useState<'personal' | 'shared'>('personal');
    const [expenseTitle, setExpenseTitle] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');

    // 여행 데이터 및 장소 정보 가져오기
    const tripData = getTravelPlan(planId || '');
    const currentDay = tripData?.days.find(day => day.dayNumber === parseInt(dayNumber || '1'));
    const place = currentDay?.places.find(p => p.id === placeId);

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

    const handleCameraPress = async () => {
        // 카메라/갤러리에서 사진 선택
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('권한 필요', '사진을 추가하려면 갤러리 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && planId && placeId) {
            const photoUri = result.assets[0].uri;
            addPhotoToPlace(planId, parseInt(dayNumber || '1'), placeId, photoUri);
        }
    };

    const handleAddPhoto = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('권한 필요', '사진을 추가하려면 갤러리 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && planId && placeId) {
            const photoUri = result.assets[0].uri;
            addPhotoToPlace(planId, parseInt(dayNumber || '1'), placeId, photoUri);
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
                    onPress: () => {
                        if (planId && placeId) {
                            deletePhotoFromPlace(planId, parseInt(dayNumber || '1'), placeId, photoId);
                        }
                    },
                },
            ]
        );
    };

    const handleTimeAdd = () => {
        setShowTimeModal(true);
    };

    const handleExpenseAdd = () => {
        setExpenseType('personal');
        setExpenseTitle('');
        setExpenseAmount('');
        setShowExpenseModal(true);
    };

    const handleSaveExpense = () => {
        if (!expenseTitle.trim()) {
            Alert.alert('알림', '지출 제목을 입력해주세요.');
            return;
        }

        const amount = parseFloat(expenseAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('알림', '유효한 금액을 입력해주세요.');
            return;
        }

        if (planId && placeId) {
            addExpenseToPlace(planId, parseInt(dayNumber || '1'), placeId, {
                title: expenseTitle,
                amount: amount,
                type: expenseType,
            });
            setShowExpenseModal(false);
            setExpenseTitle('');
            setExpenseAmount('');
        }
    };

    const handleDeleteExpense = (expenseId: string) => {
        Alert.alert(
            '지출 삭제',
            '이 지출 내역을 삭제하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        if (planId && placeId) {
                            deleteExpenseFromPlace(planId, parseInt(dayNumber || '1'), placeId, expenseId);
                        }
                    },
                },
            ]
        );
    };

    const handleMemoAdd = () => {
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
                    onPress: () => {
                        // TODO: 장소 삭제 구현
                        console.log('Delete place');
                        router.back();
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
                    <TouchableOpacity onPress={handleCameraPress} style={styles.cameraButton}>
                        <MaterialIcons name="photo-camera" size={32} color="#C7C7C7" />
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

                {/* 사진 영역 */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.photoSection}
                    contentContainerStyle={styles.photoSectionContent}
                >
                    {/* 저장된 사진들 표시 */}
                    {place.photos?.map((photo) => (
                        <TouchableOpacity
                            key={photo.id}
                            style={styles.photoContainer}
                            onLongPress={() => handleDeletePhoto(photo.id)}
                        >
                            <Image
                                source={{ uri: photo.uri }}
                                style={styles.photoThumbnail}
                            />
                            <TouchableOpacity
                                style={styles.deletePhotoButton}
                                onPress={() => handleDeletePhoto(photo.id)}
                            >
                                <Feather name="x" size={16} color="#fff" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}

                    {/* 사진 추가 버튼 */}
                    <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                        <Feather name="plus" size={48} color="#C7C7C7" />
                    </TouchableOpacity>
                </ScrollView>

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
                        <Text style={styles.modalTitle}>{place.name}</Text>
                        <TextInput
                            style={[styles.modalInput, styles.memoInput]}
                            placeholder="메모를 입력하세요"
                            placeholderTextColor="#9E9E9E"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowMemoModal(false)}>
                                <Text style={styles.modalCancelText}>삭제하기</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowMemoModal(false);
                                    Alert.alert('안내', '메모 저장 기능은 추후 구현 예정입니다.');
                                }}
                            >
                                <Text style={styles.modalConfirmText}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
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
        paddingHorizontal: 22,
    },
    modalCancelText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#585858',
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
    },
    memoInput: {
        height: 80,
        marginBottom: 16,
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
});

