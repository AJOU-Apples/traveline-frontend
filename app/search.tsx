import React, {useState} from 'react';
import {View, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {Text, Searchbar} from 'react-native-paper';
import {router} from 'expo-router';
import {Feather} from '@expo/vector-icons';

// TODO: BE에서 검색 결과 받아오기
const DUMMY_SEARCH_RESULTS: SearchResult[] = [
    {id: '1', type: 'destination', name: '도쿄', description: '일본'},
    {id: '2', type: 'destination', name: '오사카', description: '일본'},
    {id: '3', type: 'team', name: 'Team Apples', description: '여행 그룹'},
];

type SearchResult = {
    id: string;
    type: 'destination' | 'team';
    name: string;
    description: string;
};

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        // TODO: BE API 호출
        if (query.trim()) {
            const filtered = DUMMY_SEARCH_RESULTS.filter(item =>
                item.name.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filtered);
        } else {
            setResults([]);
        }
    };

    const renderResultItem = ({item}: { item: SearchResult }) => (
        <TouchableOpacity style={styles.resultItem}>
            <Feather
                name={item.type === 'destination' ? 'map-pin' : 'users'}
                size={20}
                color="#585858"
            />
            <View style={styles.resultContent}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultDescription}>{item.description}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000"/>
                </TouchableOpacity>
                <View style={styles.searchBarContainer}>
                    <Searchbar
                        placeholder="검색어를 입력하세요"
                        onChangeText={handleSearch}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        autoFocus
                    />
                </View>
            </View>

            <FlatList
                data={results}
                renderItem={renderResultItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    searchQuery.trim() ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>검색어를 입력해주세요</Text>
                        </View>
                    )
                }
            />
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
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
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
        minHeight: 0,
        paddingVertical: 0,
    },
    listContainer: {
        padding: 20,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    resultContent: {
        marginLeft: 12,
        flex: 1,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    resultDescription: {
        fontSize: 14,
        color: '#585858',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#9E9E9E',
    },
});

