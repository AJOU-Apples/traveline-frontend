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

interface LocationBasedImagePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectPhotos: (photoUris: string[]) => void;
    placeLatitude?: number;
    placeLongitude?: number;
    placeName: string;
}

export default function LocationBasedImagePicker({
    visible,
    onClose,
    onSelectPhotos,
    placeLatitude,
    placeLongitude,
    placeName,
}: LocationBasedImagePickerProps) {
    const [photos, setPhotos] = useState<PhotoWithDistance[]>([]);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [hasNearbyPhotos, setHasNearbyPhotos] = useState(false);

    useEffect(() => {
        if (visible) {
            requestPermissionAndLoadPhotos();
            setSelectedPhotos(new Set()); // 모달이 열릴 때마다 선택 초기화
        }
    }, [visible]);

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
            } else {
                newSet.add(assetId);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        const selectedUris = photos
            .filter((photo) => selectedPhotos.has(photo.asset.id))
            .map((photo) => photo.asset.uri);

        onSelectPhotos(selectedUris);
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
                            추가 ({selectedPhotos.size})
                        </Text>
                    </TouchableOpacity>
                </View>

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
                            renderItem={({ item, index }) => (
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
                                    {selectedPhotos.has(item.asset.id) && (
                                        <View style={styles.selectedOverlay}>
                                            <View style={styles.checkmark}>
                                                <Feather name="check" size={16} color="#fff" />
                                            </View>
                                        </View>
                                    )}
                                    {hasNearbyPhotos && item.hasLocation && item.distance !== undefined && (
                                        <View style={styles.distanceBadge}>
                                            <Text style={styles.distanceText}>
                                                {formatDistance(item.distance)}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
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
});

