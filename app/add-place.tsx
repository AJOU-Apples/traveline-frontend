import React, {useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import {Text} from 'react-native-paper';
import {router, useLocalSearchParams} from 'expo-router';
import {Feather} from '@expo/vector-icons';
import {useUser} from '../src/context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'recent_place_searches';
const MAX_RECENT_SEARCHES = 10; // 최대 저장 개수

type SearchResult = {
    name: string;
    address: string;
    placeId?: string;
    latitude?: number;
    longitude?: number;
};

// Google Places API 키 (app.json에 설정된 키 사용)
// IMPORTANT: Google Places API를 사용하려면 다음 설정이 필요합니다:
// 1. Google Cloud Console에서 Places API 활성화
// 2. API 키에 Places API 권한 추가
// 3. 실제 프로덕션에서는 백엔드에서 호출하는 것이 권장됨 (API 키 노출 방지)
// TODO: 추후 BE API로 이전 예정
const GOOGLE_MAPS_API_KEY = 'AIzaSyCoD_272LfO6ENbwlzvrnlJlvPh6ysLKSs';

export default function AddPlaceScreen() {
    const {planId, dayNumber, destination, latitude, longitude} = useLocalSearchParams<{
        planId: string;
        dayNumber: string;
        destination?: string;
        latitude?: string;
        longitude?: string;
    }>();
    const {addPlaceToDay} = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 여행지 중심 좌표
    const centerLat = latitude ? parseFloat(latitude) : null;
    const centerLng = longitude ? parseFloat(longitude) : null;

    // 최근 검색어 로드
    useEffect(() => {
        loadRecentSearches();
    }, []);

    const loadRecentSearches = async () => {
        try {
            const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load recent searches:', error);
        }
    };

    const saveRecentSearch = async (query: string) => {
        try {
            const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            let searches: string[] = stored ? JSON.parse(stored) : [];

            // 중복 제거
            searches = searches.filter(s => s !== query);

            // 맨 앞에 추가
            searches.unshift(query);

            // 최대 개수 제한
            if (searches.length > MAX_RECENT_SEARCHES) {
                searches = searches.slice(0, MAX_RECENT_SEARCHES);
            }

            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
            setRecentSearches(searches);
        } catch (error) {
            console.error('Failed to save recent search:', error);
        }
    };

    const clearRecentSearches = async () => {
        try {
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
            setRecentSearches([]);
        } catch (error) {
            console.error('Failed to clear recent searches:', error);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleDirectAdd = () => {
        // TODO: 직접 장소 추가 모달/화면 구현
        Alert.alert('안내', '직접 장소 추가 기능은 추후 구현 예정입니다.');
    };

    const handleSearchSubmit = async () => {
        if (!searchQuery.trim()) {
            return;
        }

        setIsLoading(true);
        try {
            // Google Places API Text Search 호출
            // location: 여행지 중심 좌표
            // radius: 검색 반경 (미터 단위, 50km = 50000m)
            // language=ko: 한국어 결과 우선
            // rankby는 radius를 사용할 때는 사용할 수 없음

            let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}&language=ko`;

            // 여행지 좌표가 있으면 해당 지역 주변으로 검색 제한
            if (centerLat && centerLng) {
                url += `&location=${centerLat},${centerLng}&radius=50000`;
            } else {
                // 좌표가 없으면 관련도 순으로 정렬
                url += `&rankby=prominence`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.results) {
                // Google Places API는 기본적으로 최대 20개의 결과를 반환하며,
                // 이미 관련도 높은 순으로 정렬되어 있습니다.
                const results: SearchResult[] = data.results.map((place: any) => ({
                    name: place.name,
                    address: place.formatted_address || '',
                    placeId: place.place_id,
                    latitude: place.geometry?.location?.lat,
                    longitude: place.geometry?.location?.lng,
                }));

                setSearchResults(results);

                // 검색 결과가 너무 적을 때 알림
                if (results.length === 0) {
                    Alert.alert('검색 결과 없음', '검색 결과를 찾을 수 없습니다.');
                }
            } else if (data.status === 'ZERO_RESULTS') {
                setSearchResults([]);
                Alert.alert('검색 결과 없음', '검색 결과를 찾을 수 없습니다. 다른 검색어를 시도해보세요.');
            } else if (data.status === 'REQUEST_DENIED') {
                console.error('Google Places API error:', data.error_message);
                Alert.alert('오류', 'API 키 설정에 문제가 있습니다. Places API를 활성화해주세요.');
                setSearchResults([]);
            } else {
                console.error('Google Places API error:', data.status, data.error_message);
                Alert.alert('오류', '장소 검색 중 문제가 발생했습니다.');
                setSearchResults([]);
            }

            // 최근 검색어에 저장
            await saveRecentSearch(searchQuery);
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('오류', '장소 검색 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecentSearchPress = (search: string) => {
        setSearchQuery(search);
        setSearchResults([]);
        // 검색 실행
        setTimeout(() => {
            handleSearchSubmit();
        }, 100);
    };

    const handleClearAll = () => {
        clearRecentSearches();
    };

    const handleAddPlace = async (result: SearchResult) => {
        if (!planId || !dayNumber) {
            Alert.alert('오류', '여행 계획 정보를 찾을 수 없습니다.');
            return;
        }

        try {
            // 장소 추가
            await addPlaceToDay(planId, parseInt(dayNumber), {
                name: result.name,
                address: result.address,
                latitude: result.latitude,
                longitude: result.longitude,
            });

            Alert.alert(
                '추가 완료',
                `${result.name}이(가) ${dayNumber}일차에 추가되었습니다.`,
                [
                    {
                        text: '확인',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error) {
            console.error('Failed to add place:', error);
            Alert.alert('오류', '장소 추가 중 오류가 발생했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#000"/>
                    </TouchableOpacity>
                    <View style={styles.searchBar}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="장소를 검색해주세요"
                            placeholderTextColor="#585858"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                            autoFocus
                        />
                        <TouchableOpacity onPress={handleSearchSubmit}>
                            <Feather name="search" size={16} color="#585858"/>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 상단 액션 영역 */}
                <View style={styles.topActions}>
                    {/* 직접 추가하기 버튼 */}
                    <TouchableOpacity style={styles.directAddButton} onPress={handleDirectAdd}>
                        <Text style={styles.directAddText}>직접 추가하기</Text>
                    </TouchableOpacity>

                    {/* 검색 지역 표시 */}
                    {destination && (
                        <View style={styles.locationBadge}>
                            <Feather name="map-pin" size={12} color="#585858"/>
                            <Text style={styles.locationBadgeText}>{destination} 주변</Text>
                        </View>
                    )}
                </View>

                {/* 최근 검색어 */}
                {recentSearches.length > 0 && (
                    <View style={styles.recentSearchSection}>
                        <View style={styles.recentSearchHeader}>
                            <Text style={styles.recentSearchTitle}>최근 검색어</Text>
                            <TouchableOpacity onPress={handleClearAll}>
                                <Text style={styles.clearAllText}>전체 삭제</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.recentSearchTags}>
                            {recentSearches.map((search, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.searchTag}
                                    onPress={() => handleRecentSearchPress(search)}
                                >
                                    <Text style={styles.searchTagText}>{search}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* 로딩 표시 */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#088CDA"/>
                    </View>
                )}

                {/* 검색 결과 리스트 */}
                {!isLoading && searchResults.length > 0 && (
                    <View style={styles.searchResultsSection}>
                        {searchResults.map((result, index) => (
                            <View key={index} style={styles.resultCard}>
                                <View style={styles.resultInfo}>
                                    <Text style={styles.resultName}>{result.name}</Text>
                                    <Text style={styles.resultAddress} numberOfLines={1}>
                                        {result.address}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => handleAddPlace(result)}
                                >
                                    <Text style={styles.addButtonText}>추가</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    backButton: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ECECEC',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 8,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: -0.2,
        color: '#000',
        paddingVertical: 0,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    topActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        marginBottom: 32,
        flexWrap: 'wrap',
    },
    directAddButton: {
        backgroundColor: '#088CDA',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 24,
        alignSelf: 'flex-start',
    },
    directAddText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 24,
    },
    locationBadgeText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    recentSearchSection: {
        marginBottom: 32,
    },
    recentSearchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    recentSearchTitle: {
        fontSize: 16,
        lineHeight: 32,
        letterSpacing: -0.2,
        fontWeight: '600',
        color: '#000',
    },
    clearAllText: {
        fontSize: 12,
        color: '#000',
    },
    recentSearchTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    searchTag: {
        backgroundColor: '#ECECEC',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchTagText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchResultsSection: {
        gap: 16,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 35,
    },
    resultInfo: {
        flex: 1,
        gap: 4,
    },
    resultName: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        fontWeight: '600',
        color: '#000',
    },
    resultAddress: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#585858',
    },
    addButton: {
        backgroundColor: '#ECECEC',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
    },
});

