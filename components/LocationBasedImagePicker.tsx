import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Modal,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    Linking,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { calculateDistance, extractGPSFromExif } from '../src/utils/locationUtils';

interface PhotoWithDistance {
    asset: MediaLibrary.Asset;
    distance?: number; // 장소로부터의 거리 (km)
    hasLocation: boolean;
}

export interface ExistingPhotoInfo {
    id: string; // Photo ID (백엔드 DB ID)
    filename: string; // 원본 파일명
    orderIndex?: number; // 기존 순서
}

interface LocationBasedImagePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectPhotos: (
        photoUris: string[], 
        visibility: 'PERSONAL' | 'SHARED',
        orderedExistingPhotoIds: string[] // 기존 사진들의 새로운 순서
    ) => void;
    placeLatitude?: number;
    placeLongitude?: number;
    placeName: string;
    initialVisibility?: 'PERSONAL' | 'SHARED'; // 초기 visibility 설정
    hideVisibilitySelector?: boolean; // visibility 선택 UI 숨기기
    existingPhotos?: ExistingPhotoInfo[]; // 이미 업로드된 사진 정보 (id + filename + orderIndex)
}

export default function LocationBasedImagePicker({
    visible,
    onClose,
    onSelectPhotos,
    placeLatitude,
    placeLongitude,
    placeName,
    initialVisibility = 'SHARED', // 기본값은 SHARED
    hideVisibilitySelector = false,
    existingPhotos = [],
}: LocationBasedImagePickerProps) {
    const [photos, setPhotos] = useState<PhotoWithDistance[]>([]);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
    const [selectedPhotoOrder, setSelectedPhotoOrder] = useState<string[]>([]); // 선택 순서 저장 (asset ID)
    const [initialSelectedPhotoIds, setInitialSelectedPhotoIds] = useState<Set<string>>(new Set()); // 초기에 선택된 사진 ID (이미 업로드된 사진)
    const [assetIdToPhotoIdMap, setAssetIdToPhotoIdMap] = useState<Map<string, string>>(new Map()); // asset ID → Photo ID 매핑
    const [selectedVisibility, setSelectedVisibility] = useState<'SHARED' | 'PERSONAL'>('SHARED');
    const [loading, setLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [hasNearbyPhotos, setHasNearbyPhotos] = useState(false);

    useEffect(() => {
        if (visible) {
            requestPermissionAndLoadPhotos();
            setSelectedPhotos(new Set()); // 초기화
            setSelectedPhotoOrder([]); // 초기화
            setInitialSelectedPhotoIds(new Set()); // 초기화
            setAssetIdToPhotoIdMap(new Map()); // 초기화
            setSelectedVisibility(initialVisibility); // 초기 visibility 설정
        }
    }, [visible, initialVisibility]);

    const requestPermissionAndLoadPhotos = async () => {
        try {
            setLoading(true);
            setPermissionDenied(false);

            // 현재 권한 상태 확인
            const { status: currentStatus, canAskAgain } = await MediaLibrary.getPermissionsAsync();
            console.log('현재 권한 상태:', currentStatus, 'canAskAgain:', canAskAgain);

            if (currentStatus === 'granted') {
                setHasPermission(true);
                await loadPhotos();
                return;
            }

            // 권한이 없고 요청할 수 있는 경우
            if (canAskAgain) {
                const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
                console.log('권한 요청 결과:', newStatus);

                if (newStatus === 'granted') {
                    setHasPermission(true);
                    await loadPhotos();
                } else {
                    setHasPermission(false);
                    setPermissionDenied(true);

                    Alert.alert(
                        '권한 필요',
                        '사진을 불러오려면 갤러리 접근 권한이 필요합니다.',
                        [
                            { text: '취소', style: 'cancel' },
                            { text: '설정으로 이동', onPress: openSettings }
                        ]
                    );
                }
            } else {
                // 다시 요청할 수 없는 경우 (사용자가 이전에 거부함)
                setHasPermission(false);
                setPermissionDenied(true);

                Alert.alert(
                    '권한 필요',
                    '사진을 불러오려면 설정에서 갤러리 접근 권한을 허용해주세요.',
                    [
                        { text: '취소', style: 'cancel' },
                        { text: '설정으로 이동', onPress: openSettings }
                    ]
                );
            }
        } catch (error) {
            console.error('권한 요청 오류:', error);
            setHasPermission(false);
            setPermissionDenied(true);
            Alert.alert(
                '오류',
                '권한 요청 중 오류가 발생했습니다.\n' + (error as Error).message
            );
        } finally {
            setLoading(false);
        }
    };

    const openSettings = async () => {
        try {
            if (Platform.OS === 'ios') {
                await Linking.openURL('app-settings:');
            } else {
                await Linking.openSettings();
            }
        } catch (error) {
            console.error('설정 열기 오류:', error);
            Alert.alert('오류', '설정 화면을 열 수 없습니다.');
        }
    };

    const loadPhotos = async () => {
        try {
            // 최근 사진 200장 가져오기
            const result = await MediaLibrary.getAssetsAsync({
                first: 200,
                mediaType: 'photo',
                sortBy: 'creationTime',
            });

            const photosWithDistance: PhotoWithDistance[] = [];

            for (const asset of result.assets) {
                try {
                    // 사진의 EXIF 정보 가져오기
                    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
                        shouldDownloadFromNetwork: false,
                    });

                    let distance: number | undefined;
                    let hasLocation = false;

                    // 장소 위치 정보와 사진의 위치 정보가 모두 있는 경우
                    if (
                        placeLatitude !== undefined &&
                        placeLongitude !== undefined &&
                        assetInfo.location
                    ) {
                        const { latitude, longitude } = assetInfo.location;
                        if (latitude && longitude) {
                            distance = calculateDistance(
                                placeLatitude,
                                placeLongitude,
                                latitude,
                                longitude
                            );
                            hasLocation = true;
                        }
                    }

                    photosWithDistance.push({
                        asset,
                        distance,
                        hasLocation,
                    });
                } catch (error) {
                    // EXIF 정보를 가져올 수 없는 경우, 위치 정보 없이 추가
                    photosWithDistance.push({
                        asset,
                        hasLocation: false,
                    });
                }
            }

            // 1km 이내의 사진이 있는지 확인
            const hasPhotosNearby = photosWithDistance.some(
                photo => photo.hasLocation && photo.distance !== undefined && photo.distance <= 1
            );
            setHasNearbyPhotos(hasPhotosNearby);

            // 1km 이내의 사진이 있으면 거리 순으로 정렬, 없으면 최신 순 유지
            if (hasPhotosNearby) {
                photosWithDistance.sort((a, b) => {
                    if (a.hasLocation && b.hasLocation) {
                        return (a.distance || 0) - (b.distance || 0);
                    } else if (a.hasLocation) {
                        return -1;
                    } else if (b.hasLocation) {
                        return 1;
                    } else {
                        return 0; // 둘 다 위치 정보가 없으면 원래 순서 유지
                    }
                });
            }
            // hasPhotosNearby가 false면 원래 순서(최신 순) 유지

            setPhotos(photosWithDistance);

            // 기존 사진 자동 선택 (filename 매칭, orderIndex 순서 반영)
            if (existingPhotos.length > 0) {
                const preselectedSet = new Set<string>();
                const assetToPhotoMap = new Map<string, string>(); // asset ID → Photo ID
                
                // filename → { assetId, photoId, orderIndex } 매핑
                const matchedPhotos: Array<{ assetId: string; photoId: string; orderIndex: number }> = [];
                
                console.log('🔍 [LocationBasedImagePicker] Existing photos count:', existingPhotos.length);
                console.log('🔍 [LocationBasedImagePicker] Existing photos:', existingPhotos);
                
                // filename 기반 매칭
                photosWithDistance.forEach((photo) => {
                    try {
                        const assetFilename = photo.asset.filename;
                        
                        console.log('🔍 [Asset info]', {
                            filename: assetFilename,
                        });
                        
                        // filename으로 매칭 및 orderIndex, photoId 가져오기
                        const matchedExisting = existingPhotos.find((existing) => {
                            return existing.filename === assetFilename;
                        });
                        
                        if (matchedExisting) {
                            console.log('✅ [LocationBasedImagePicker] Match found:', {
                                filename: assetFilename,
                                photoId: matchedExisting.id,
                                orderIndex: matchedExisting.orderIndex
                            });
                            
                            matchedPhotos.push({
                                assetId: photo.asset.id,
                                photoId: matchedExisting.id, // 백엔드 Photo ID
                                orderIndex: matchedExisting.orderIndex ?? 999999 // orderIndex가 없으면 맨 뒤로
                            });
                            preselectedSet.add(photo.asset.id);
                            assetToPhotoMap.set(photo.asset.id, matchedExisting.id); // 매핑 저장
                        }
                    } catch (error) {
                        console.error('Asset info 확인 실패:', photo.asset.id, error);
                    }
                });
                
                // orderIndex 순서대로 정렬
                matchedPhotos.sort((a, b) => a.orderIndex - b.orderIndex);
                const preselectedIds = matchedPhotos.map(p => p.assetId);
                
                console.log('✅ [LocationBasedImagePicker] Preselected count:', preselectedIds.length);
                console.log('✅ [LocationBasedImagePicker] Order:', matchedPhotos.map(p => p.orderIndex));
                
                setSelectedPhotos(preselectedSet);
                setSelectedPhotoOrder(preselectedIds);
                setInitialSelectedPhotoIds(preselectedSet); // 초기 선택된 사진 저장 (이미 업로드된 사진)
                setAssetIdToPhotoIdMap(assetToPhotoMap); // asset ID → Photo ID 매핑 저장
            }
        } catch (error) {
            console.error('사진 로딩 오류:', error);
            Alert.alert('오류', '사진을 불러오는 중 오류가 발생했습니다.');
        }
    };

    const togglePhotoSelection = (assetId: string) => {
        setSelectedPhotos((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(assetId)) {
                newSet.delete(assetId);
                // 순서 배열에서도 제거
                setSelectedPhotoOrder((prevOrder) => prevOrder.filter((id) => id !== assetId));
            } else {
                newSet.add(assetId);
                // 순서 배열에 추가
                setSelectedPhotoOrder((prevOrder) => [...prevOrder, assetId]);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        // selectedPhotoOrder를 기존 사진과 새 사진으로 분리
        const orderedExistingPhotoIds: string[] = []; // 기존 사진의 Photo ID (순서대로)
        const newlySelectedAssetIds: string[] = []; // 새 사진의 asset ID (순서대로)
        
        selectedPhotoOrder.forEach((assetId) => {
            if (initialSelectedPhotoIds.has(assetId)) {
                // 기존 사진: asset ID → Photo ID 변환
                const photoId = assetIdToPhotoIdMap.get(assetId);
                if (photoId) {
                    orderedExistingPhotoIds.push(photoId);
                }
            } else {
                // 새 사진
                newlySelectedAssetIds.push(assetId);
            }
        });
        
        console.log('📤 [LocationBasedImagePicker] Total selected:', selectedPhotoOrder.length);
        console.log('📤 [LocationBasedImagePicker] Existing photos (ordered):', orderedExistingPhotoIds);
        console.log('📤 [LocationBasedImagePicker] New photos to upload:', newlySelectedAssetIds.length);
        
        // 새로 추가된 사진의 URI 추출
        const photoMap = new Map(photos.map(p => [p.asset.id, p.asset.uri]));
        const newPhotoUris = newlySelectedAssetIds
            .map(id => photoMap.get(id))
            .filter((uri): uri is string => uri !== undefined);

        // 새 사진 URI, visibility, 기존 사진 순서 전달
        onSelectPhotos(newPhotoUris, selectedVisibility, orderedExistingPhotoIds);
        setSelectedVisibility('SHARED'); // 초기화
        onClose();
    };

    const formatDistance = (distance?: number): string => {
        if (distance === undefined) return '';
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        }
        return `${distance.toFixed(1)}km`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            transparent={false}
        >
            <View style={styles.container}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Feather name="x" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{placeName}</Text>
                        {!loading && hasNearbyPhotos && (
                            <Text style={styles.headerSubtitle}>근처 사진 우선 표시</Text>
                        )}
                        {!loading && !hasNearbyPhotos && photos.length > 0 && (
                            <Text style={styles.headerSubtitle}>최신 사진 순</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={handleConfirm}
                        style={styles.confirmButton}
                        disabled={selectedPhotos.size === 0}
                    >
                        <Text
                            style={[
                                styles.confirmText,
                                selectedPhotos.size === 0 && styles.confirmTextDisabled,
                            ]}
                        >
                            추가 ({selectedPhotoOrder.filter(id => !initialSelectedPhotoIds.has(id)).length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 앨범 선택 UI (hideVisibilitySelector가 false일 때만 표시) */}
                {!hideVisibilitySelector && (
                    <View style={styles.visibilitySelector}>
                        <TouchableOpacity
                            style={[
                                styles.visibilityOption,
                                selectedVisibility === 'SHARED' && styles.visibilityOptionActive
                            ]}
                            onPress={() => setSelectedVisibility('SHARED')}
                        >
                            <Feather
                                name="users"
                                size={16}
                                color={selectedVisibility === 'SHARED' ? '#088CDA' : '#9E9E9E'}
                            />
                            <Text style={[
                                styles.visibilityText,
                                selectedVisibility === 'SHARED' && styles.visibilityTextActive
                            ]}>공용 앨범</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.visibilityOption,
                                selectedVisibility === 'PERSONAL' && styles.visibilityOptionActive
                            ]}
                            onPress={() => setSelectedVisibility('PERSONAL')}
                        >
                            <Feather
                                name="lock"
                                size={16}
                                color={selectedVisibility === 'PERSONAL' ? '#088CDA' : '#9E9E9E'}
                            />
                            <Text style={[
                                styles.visibilityText,
                                selectedVisibility === 'PERSONAL' && styles.visibilityTextActive
                            ]}>개인 앨범</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 로딩 */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#088CDA" />
                        <Text style={styles.loadingText}>사진을 불러오는 중...</Text>
                    </View>
                )}

                {/* 사진 그리드 */}
                {!loading && hasPermission && (
                    photos.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>사진이 없습니다</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={photos}
                            keyExtractor={(photo) => photo.asset.id}
                            numColumns={3}
                            style={styles.photoList}
                            contentContainerStyle={styles.photoGrid}
                            columnWrapperStyle={styles.photoRow}
                            renderItem={({ item, index }) => {
                                const isSelected = selectedPhotos.has(item.asset.id);
                                const orderIndex = selectedPhotoOrder.indexOf(item.asset.id);
                                const orderNumber = orderIndex >= 0 ? orderIndex + 1 : 0;
                                
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.photoItem,
                                            (index + 1) % 3 !== 0 && styles.photoItemSpacing,
                                        ]}
                                        onPress={() => togglePhotoSelection(item.asset.id)}
                                    >
                                        <Image
                                            source={{ uri: item.asset.uri }}
                                            style={styles.photoImage}
                                        />
                                        {isSelected && (
                                            <>
                                                <View style={styles.selectedOverlay} />
                                                <View style={styles.orderBadge}>
                                                    <Text style={styles.orderText}>{orderNumber}</Text>
                                                </View>
                                            </>
                                        )}
                                        {!isSelected && hasNearbyPhotos && item.hasLocation && item.distance !== undefined && (
                                            <View style={styles.distanceBadge}>
                                                <Text style={styles.distanceText}>
                                                    {formatDistance(item.distance)}
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )
                )}

                {/* 권한 없음 */}
                {!loading && !hasPermission && (
                    <View style={styles.emptyContainer}>
                        <Feather name="image" size={64} color="#C7C7C7" />
                        <Text style={styles.emptyText}>갤러리 접근 권한이 필요합니다</Text>
                        <Text style={styles.permissionHintText}>
                            {placeName}에 사진을 추가하려면{'\n'}
                            갤러리 접근 권한을 허용해주세요
                        </Text>
                        {permissionDenied ? (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={openSettings}
                            >
                                <Text style={styles.retryButtonText}>설정으로 이동</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={requestPermissionAndLoadPhotos}
                            >
                                <Text style={styles.retryButtonText}>권한 허용</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
}

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 32 - 8) / 3; // 3열 그리드

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#088CDA',
    },
    confirmButton: {
        width: 80,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#088CDA',
    },
    confirmTextDisabled: {
        color: '#C7C7C7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: '#585858',
    },
    photoList: {
        flex: 1,
    },
    photoGrid: {
        padding: 16,
    },
    photoRow: {
        justifyContent: 'flex-start',
    },
    photoItem: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        marginBottom: 4,
        position: 'relative',
    },
    photoItemSpacing: {
        marginRight: 4,
    },
    photoImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F6F6F6',
    },
    selectedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(8, 140, 218, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#088CDA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderBadge: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#088CDA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    orderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    distanceBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    distanceText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#585858',
        marginBottom: 8,
    },
    permissionHintText: {
        fontSize: 14,
        color: '#9E9E9E',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#088CDA',
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    visibilitySelector: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    visibilityOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F6F6F6',
    },
    visibilityOptionActive: {
        backgroundColor: '#E3F2FD',
        borderWidth: 1,
        borderColor: '#088CDA',
    },
    visibilityText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#9E9E9E',
    },
    visibilityTextActive: {
        color: '#088CDA',
        fontWeight: '600',
    },
});

