import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Platform, Alert, ActivityIndicator } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CityDto, getDomesticCities, getInternationalCities } from '../src/utils/cityApi';

type Destination = CityDto;

export default function NewScheduleScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState<'domestic' | 'international'>('international');
    const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
    const [domesticCities, setDomesticCities] = useState<Destination[]>([]);
    const [internationalCities, setInternationalCities] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 도시 목록 가져오기
    const fetchCities = async () => {
        setLoading(true);
        setError(null);
        try {
            const [domestic, international] = await Promise.all([
                getDomesticCities(),
                getInternationalCities()
            ]);
            setDomesticCities(domestic);
            setInternationalCities(international);
        } catch (err) {
            console.error('Failed to fetch cities:', err);
            setError('도시 목록을 불러오는데 실패했습니다.');
            Alert.alert('오류', '도시 목록을 불러오는데 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCities();
    }, []);

    const destinations = selectedTab === 'domestic'
        ? domesticCities
        : internationalCities;

    const filteredDestinations = destinations.filter(dest =>
        dest.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectDestination = (destination: Destination) => {
        // 이미 같은 도시가 선택된 경우 선택 해제
        if (selectedDestination?.id === destination.id) {
            setSelectedDestination(null);
            return;
        }

        // 다른 도시가 이미 선택되어 있는 경우 경고 메시지
        if (selectedDestination) {
            Alert.alert(
                '여행지 선택',
                `여행지는 하나만 선택할 수 있어요.\n여행지를 ${destination.name}로 변경할까요?`,
                [
                    {
                        text: '취소',
                        style: 'cancel',
                    },
                    {
                        text: '변경',
                        onPress: () => setSelectedDestination(destination),
                    },
                ]
            );
            return;
        }

        // 선택되지 않은 경우 선택
        setSelectedDestination(destination);
    };

    const handleConfirmSelection = () => {
        if (selectedDestination) {
            // 날짜 선택 화면으로 이동하면서 선택한 여행지 전달
            router.push({
                pathname: '/date-selection',
                params: {
                    destinationId: selectedDestination.id.toString(),
                    destinationName: selectedDestination.name
                }
            });
        }
    };

    const isSelected = (destination: Destination) => {
        return selectedDestination?.id === destination.id;
    };

    const renderDestinationItem = ({ item }: { item: Destination }) => {
        const selected = isSelected(item);
        return (
            <View style={styles.cityCard}>
                <Text style={styles.cityName}>{item.name}</Text>
                <TouchableOpacity
                    style={[styles.selectButton, selected && styles.selectButtonActive]}
                    onPress={() => handleSelectDestination(item)}
                >
                    <Text style={[styles.selectButtonText, selected && styles.selectButtonTextActive]}>
                        선택
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.searchBarContainer}>
                        <Searchbar
                            placeholder="여행, 어디로 떠나시나요?"
                            onChangeText={setSearchQuery}
                            value={searchQuery}
                            style={styles.searchBar}
                            inputStyle={styles.searchInput}
                            iconColor="#585858"
                        />
                    </View>
                </View>
            </View>

            {/* 탭 (국내/해외) */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    onPress={() => setSelectedTab('domestic')}
                    style={styles.tab}
                >
                    <Text style={[
                        styles.tabText,
                        selectedTab === 'domestic' && styles.tabTextActive
                    ]}>
                        국내
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setSelectedTab('international')}
                    style={styles.tab}
                >
                    <Text style={[
                        styles.tabText,
                        selectedTab === 'international' && styles.tabTextActive
                    ]}>
                        해외
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 도시 리스트 */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#088CDA" />
                    <Text style={styles.loadingText}>도시 목록을 불러오는 중...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchCities}
                    >
                        <Text style={styles.retryButtonText}>다시 시도</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredDestinations}
                    renderItem={renderDestinationItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={true}
                    style={styles.list}
                />
            )}

            {/* 하단 선택 완료 버튼 */}
            {selectedDestination && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmSelection}
                    >
                        <Text style={styles.confirmButtonText}>
                            {selectedDestination.name} 선택 완료
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
        paddingTop: 24,
        paddingBottom: 8,
        paddingHorizontal: 16,
        height: 88,
    },
    headerContent: {
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
    searchBarContainer: {
        flex: 1,
    },
    searchBar: {
        backgroundColor: '#ECECEC',
        borderRadius: 8,
        height: 40,
        elevation: 0,
    },
    searchInput: {
        fontSize: 16,
        color: '#585858',
        minHeight: 0,
        paddingVertical: 0,
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    tab: {
        paddingVertical: 4,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 32,
        letterSpacing: -0.2,
        color: '#000',
    },
    tabTextActive: {
        color: '#088CDA',
    },
    list: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#585858',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        fontSize: 14,
        color: '#FF5252',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    cityCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 48,
        marginBottom: 4,
    },
    cityName: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.2,
        color: '#000',
    },
    selectButton: {
        backgroundColor: '#ECECEC',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectButtonActive: {
        backgroundColor: '#088CDA',
    },
    selectButtonText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
    },
    selectButtonTextActive: {
        color: '#fff',
    },
    bottomBar: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    },
    confirmButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.2,
        color: '#fff',
    },
});

