import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

interface PhotoWithDistance {
    asset: MediaLibrary.Asset;
    thumbnailUri?: string; // 썸네일 URI (빠른 로딩용)
    fullUri?: string; // 실제 파일 URI (업로드용, 선택 시 다운로드)
    isDownloading?: boolean; // 다운로드 중인지 여부
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
    placeName: string;
    initialVisibility?: 'PERSONAL' | 'SHARED'; // 초기 visibility 설정
    hideVisibilitySelector?: boolean; // visibility 선택 UI 숨기기
    existingPhotos?: ExistingPhotoInfo[]; // 이미 업로드된 사진 정보 (id + filename + orderIndex)
}

export default function LocationBasedImagePicker({
    visible,
    onClose,
    onSelectPhotos,
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
    const [loadingMore, setLoadingMore] = useState(false); // 추가 로딩 중인지 여부
    const [hasPermission, setHasPermission] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [downloadingPhotos, setDownloadingPhotos] = useState<Set<string>>(new Set()); // 다운로드 중인 사진 ID
    const [endCursor, setEndCursor] = useState<string | undefined>(undefined); // 다음 페이지 커서
    const [hasNextPage, setHasNextPage] = useState(true); // 더 가져올 사진이 있는지 여부

    useEffect(() => {
        if (visible) {
            requestPermissionAndLoadPhotos();
            setSelectedPhotos(new Set()); // 초기화
            setSelectedPhotoOrder([]); // 초기화
            setInitialSelectedPhotoIds(new Set()); // 초기화
            setAssetIdToPhotoIdMap(new Map()); // 초기화
            setSelectedVisibility(initialVisibility); // 초기 visibility 설정
            setPhotos([]); // 사진 목록 초기화
            setEndCursor(undefined); // 커서 초기화
            setHasNextPage(true); // 다음 페이지 있음으로 초기화
        }
    }, [visible, initialVisibility]);

    // 기존 사진 자동 선택 (filename 매칭, orderIndex 순서 반영)
    useEffect(() => {
        if (photos.length > 0 && existingPhotos.length > 0 && initialSelectedPhotoIds.size === 0) {
            const preselectedSet = new Set<string>();
            const assetToPhotoMap = new Map<string, string>(); // asset ID → Photo ID

            // filename → { assetId, photoId, orderIndex } 매핑
            const matchedPhotos: Array<{ assetId: string; photoId: string; orderIndex: number }> = [];

            // filename 기반 매칭
            photos.forEach((photo) => {
                try {
                    const assetFilename = photo.asset.filename;

                    // filename으로 매칭 및 orderIndex, photoId 가져오기
                    const matchedExisting = existingPhotos.find((existing) => {
                        return existing.filename === assetFilename;
                    });

                    if (matchedExisting) {
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

            setSelectedPhotos(preselectedSet);
            setSelectedPhotoOrder(preselectedIds);
            setInitialSelectedPhotoIds(preselectedSet); // 초기 선택된 사진 저장 (이미 업로드된 사진)
            setAssetIdToPhotoIdMap(assetToPhotoMap); // asset ID → Photo ID 매핑 저장
        }
    }, [photos, existingPhotos]);

    const requestPermissionAndLoadPhotos = async () => {
        try {
            setLoading(true);
            setPermissionDenied(false);

            // 현재 권한 상태 확인
            const { status: currentStatus, canAskAgain } = await MediaLibrary.getPermissionsAsync();

            if (currentStatus === 'granted') {
                setHasPermission(true);
                await loadPhotos();
                return;
            }

            // 권한이 없고 요청할 수 있는 경우
            if (canAskAgain) {
                const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();

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

    const loadPhotos = async (isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            // 초기 로딩은 30개, 추가 로딩도 30개씩
            const result = await MediaLibrary.getAssetsAsync({
                first: 30,
                after: isLoadMore ? endCursor : undefined,
                mediaType: 'photo',
                sortBy: 'creationTime',
            });

            // getAssetInfoAsync를 호출하지 않고 asset.uri만 사용 (빠른 로딩)
            // asset.uri (ph:// 경로 등)만으로도 Image 컴포넌트가 썸네일을 빠르게 렌더링 가능
            const photosWithDistance: PhotoWithDistance[] = result.assets.map(asset => ({
                asset,
                thumbnailUri: asset.uri, // asset.uri를 썸네일로 직접 사용
                fullUri: undefined, // 실제 파일 경로는 선택 시 다운로드
            }));

            // 기존 사진 목록에 추가
            if (isLoadMore) {
                setPhotos(prev => [...prev, ...photosWithDistance]);
            } else {
                setPhotos(photosWithDistance);
            }

            // 다음 페이지 정보 업데이트
            setEndCursor(result.endCursor);
            setHasNextPage(result.hasNextPage);

            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }

            // 기존 사진 자동 선택은 useEffect에서 처리
        } catch (error) {
            console.error('사진 로딩 오류:', error);
            Alert.alert('오류', '사진을 불러오는 중 오류가 발생했습니다.');
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    // 추가 사진 로딩 (무한 스크롤)
    const loadMorePhotos = async () => {
        if (!hasNextPage || loadingMore || loading) {
            return;
        }
        await loadPhotos(true);
    };

    // 사진 선택 시 실제 파일 다운로드 (URI 반환)
    const downloadPhoto = async (assetId: string): Promise<string | null> => {
        const photo = photos.find(p => p.asset.id === assetId);

        // 이미 fullUri가 있다면 그것을 반환
        if (photo?.fullUri) {
            return photo.fullUri;
        }

        if (!photo) {
            return null;
        }

        // 이미 다운로드 중이면 스킵
        if (downloadingPhotos.has(assetId)) {
            return null;
        }

        setDownloadingPhotos(prev => new Set(prev).add(assetId));

        try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(photo.asset, {
                shouldDownloadFromNetwork: true, // iCloud 사진 다운로드
            });

            // file://로 시작하는 실제 파일 경로만 사용 (ph:// 제외)
            let fullUri: string | undefined;
            if (assetInfo.localUri && assetInfo.localUri.startsWith('file://')) {
                fullUri = assetInfo.localUri;
            } else if (assetInfo.uri && assetInfo.uri.startsWith('file://')) {
                fullUri = assetInfo.uri;
            }
            // ph:// URI는 사용하지 않음 (업로드 불가)

            // 상태 업데이트 (UI 갱신용)
            setPhotos(prevPhotos =>
                prevPhotos.map(p =>
                    p.asset.id === assetId
                        ? { ...p, fullUri: fullUri, isDownloading: false }
                        : p
                )
            );

            return fullUri || null;
        } catch (error) {
            console.error(`Failed to download asset ${assetId}:`, error);
            // 에러 발생 시 fullUri는 undefined로 유지 (ph://는 업로드 불가)
            setPhotos(prevPhotos =>
                prevPhotos.map(p =>
                    p.asset.id === assetId
                        ? { ...p, isDownloading: false }
                        : p
                )
            );
            return null;
        } finally {
            setDownloadingPhotos(prev => {
                const newSet = new Set(prev);
                newSet.delete(assetId);
                return newSet;
            });
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
                // 사진 선택 시 실제 파일 다운로드 시작
                downloadPhoto(assetId);
            }
            return newSet;
        });
    };

    const handleConfirm = async () => {
        setLoading(true); // 전체 로딩 시작

        try {
            // 1. 새로 선택된 사진들의 Asset ID 추출
            const newlySelectedAssetIds = selectedPhotoOrder.filter(id => !initialSelectedPhotoIds.has(id));

            // 2. 각 Asset ID에 대해 다운로드 실행 (병렬 처리)
            // map 안에서 downloadPhoto를 호출하면 최신 URI를 반환받을 수 있음
            const uriPromises = newlySelectedAssetIds.map(async (assetId) => {
                return await downloadPhoto(assetId);
            });
            const results = await Promise.all(uriPromises);

            // 3. 유효한 URI만 필터링 (null 제외, ph:// 제외)
            const newPhotoUris = results.filter((uri): uri is string =>
                uri !== null &&
                (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('/'))
            );

            // 4. 기존 사진 ID 순서 정리
            const orderedExistingPhotoIds: string[] = [];
            selectedPhotoOrder.forEach((assetId) => {
                if (initialSelectedPhotoIds.has(assetId)) {
                    const photoId = assetIdToPhotoIdMap.get(assetId);
                    if (photoId) {
                        orderedExistingPhotoIds.push(photoId);
                    }
                }
            });

            // 5. 결과 전달
            onSelectPhotos(newPhotoUris, selectedVisibility, orderedExistingPhotoIds);
            setSelectedVisibility('SHARED');
            onClose();
        } catch (error) {
            console.error('확인 처리 중 오류:', error);
            Alert.alert('오류', '사진을 처리하는 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
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
                            onEndReached={loadMorePhotos}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                loadingMore ? (
                                    <View style={styles.loadingMoreContainer}>
                                        <ActivityIndicator size="small" color="#088CDA" />
                                        <Text style={styles.loadingMoreText}>사진을 불러오는 중...</Text>
                                    </View>
                                ) : null
                            }
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
                                            source={{ uri: item.thumbnailUri || item.asset.uri }}
                                            style={styles.photoImage}
                                            contentFit="cover"
                                            transition={200}
                                            cachePolicy="memory-disk"
                                        />
                                        {downloadingPhotos.has(item.asset.id) && (
                                            <View style={styles.downloadingOverlay}>
                                                <ActivityIndicator size="small" color="#fff" />
                                            </View>
                                        )}
                                        {isSelected && (
                                            <>
                                                <View style={styles.selectedOverlay} />
                                                <View style={styles.orderBadge}>
                                                    <Text style={styles.orderText}>{orderNumber}</Text>
                                                </View>
                                            </>
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
    downloadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
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
    loadingMoreContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingMoreText: {
        fontSize: 12,
        color: '#9E9E9E',
    },
});

