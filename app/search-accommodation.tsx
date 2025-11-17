import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

type SearchResult = {
    name: string;
    address: string;
    placeId?: string;
    latitude?: number;
    longitude?: number;
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyCoD_272LfO6ENbwlzvrnlJlvPh6ysLKSs';

export default function SearchAccommodationScreen() {
    const { planId } = useLocalSearchParams<{ planId: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const handleDirectAdd = () => {
        router.push({
            pathname: '/add-accommodation',
            params: { planId },
        });
    };

    const handleSearchSubmit = async () => {
        if (!searchQuery.trim()) {
            return;
        }

        setIsLoading(true);
        try {
            // Google Places API Text Search 호출 (숙소 타입으로 필터링)
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
                searchQuery
            )}&type=lodging&key=${GOOGLE_MAPS_API_KEY}&language=ko`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.results) {
                const results: SearchResult[] = data.results.map((place: any) => ({
                    name: place.name,
                    address: place.formatted_address || '',
                    placeId: place.place_id,
                    latitude: place.geometry?.location?.lat,
                    longitude: place.geometry?.location?.lng,
                }));

                setSearchResults(results);

                if (results.length === 0) {
                    Alert.alert('검색 결과 없음', '검색 결과를 찾을 수 없습니다.');
                }
            } else if (data.status === 'ZERO_RESULTS') {
                setSearchResults([]);
                Alert.alert(
                    '검색 결과 없음',
                    '검색 결과를 찾을 수 없습니다. 다른 검색어를 시도해보세요.'
                );
            } else {
                console.error('Google Places API error:', data.status, data.error_message);
                Alert.alert('오류', '숙소 검색 중 문제가 발생했습니다.');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert(
                '오류',
                '숙소 검색 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.'
            );
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAccommodation = (result: SearchResult) => {
        router.push({
            pathname: '/add-accommodation',
            params: {
                planId,
                name: result.name,
                address: result.address,
                latitude: result.latitude?.toString(),
                longitude: result.longitude?.toString(),
            },
        });
    };

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.searchBar}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="숙소명 검색"
                            placeholderTextColor="#585858"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                            autoFocus
                        />
                        <TouchableOpacity onPress={handleSearchSubmit}>
                            <Feather name="search" size={16} color="#585858" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 직접 추가하기 버튼 */}
                <TouchableOpacity style={styles.directAddButton} onPress={handleDirectAdd}>
                    <Text style={styles.directAddText}>직접 추가하기</Text>
                </TouchableOpacity>

                {/* 로딩 표시 */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#088CDA" />
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
                                    onPress={() => handleSelectAccommodation(result)}
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
    directAddButton: {
        backgroundColor: '#ECECEC',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 24,
        alignSelf: 'flex-start',
        marginTop: 16,
        marginBottom: 32,
    },
    directAddText: {
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

