import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUser } from '../src/context/UserContext';

type Airport = {
    name: string;
    code: string;
    city: string;
    country: string;
};

// 주요 공항 목록
const AIRPORTS: Airport[] = [
    // 한국
    { name: '인천 국제 공항', code: 'ICN', city: '인천', country: '한국' },
    { name: '김포 국제 공항', code: 'GMP', city: '서울', country: '한국' },
    { name: '김해 국제 공항', code: 'PUS', city: '부산', country: '한국' },
    { name: '제주 국제 공항', code: 'CJU', city: '제주', country: '한국' },
    { name: '대구 국제 공항', code: 'TAE', city: '대구', country: '한국' },
    { name: '청주 국제 공항', code: 'CJJ', city: '청주', country: '한국' },
    { name: '무안 국제 공항', code: 'MWX', city: '무안', country: '한국' },
    
    // 일본
    { name: '나리타 국제 공항', code: 'NRT', city: '도쿄', country: '일본' },
    { name: '하네다 공항', code: 'HND', city: '도쿄', country: '일본' },
    { name: '간사이 국제 공항', code: 'KIX', city: '오사카', country: '일본' },
    { name: '이타미 공항', code: 'ITM', city: '오사카', country: '일본' },
    { name: '후쿠오카 공항', code: 'FUK', city: '후쿠오카', country: '일본' },
    { name: '신치토세 공항', code: 'CTS', city: '삿포로', country: '일본' },
    { name: '나하 공항', code: 'OKA', city: '오키나와', country: '일본' },
    { name: '주부 센트레아 국제공항', code: 'NGO', city: '나고야', country: '일본' },
    
    // 중국
    { name: '베이징 수도 국제공항', code: 'PEK', city: '베이징', country: '중국' },
    { name: '베이징 다싱 국제공항', code: 'PKX', city: '베이징', country: '중국' },
    { name: '상하이 푸둥 국제공항', code: 'PVG', city: '상하이', country: '중국' },
    { name: '상하이 훙차오 국제공항', code: 'SHA', city: '상하이', country: '중국' },
    { name: '광저우 바이윈 국제공항', code: 'CAN', city: '광저우', country: '중국' },
    { name: '선전 바오안 국제공항', code: 'SZX', city: '선전', country: '중국' },
    { name: '청두 솽류 국제공항', code: 'CTU', city: '청두', country: '중국' },
    
    // 동남아
    { name: '수완나품 국제공항', code: 'BKK', city: '방콕', country: '태국' },
    { name: '돈므앙 국제공항', code: 'DMK', city: '방콕', country: '태국' },
    { name: '푸켓 국제공항', code: 'HKT', city: '푸켓', country: '태국' },
    { name: '싱가포르 창이 국제공항', code: 'SIN', city: '싱가포르', country: '싱가포르' },
    { name: '노이바이 국제공항', code: 'HAN', city: '하노이', country: '베트남' },
    { name: '탄손낫 국제공항', code: 'SGN', city: '호치민', country: '베트남' },
    { name: '다낭 국제공항', code: 'DAD', city: '다낭', country: '베트남' },
    { name: '니노이 아키노 국제공항', code: 'MNL', city: '마닐라', country: '필리핀' },
    { name: '쿠알라룸푸르 국제공항', code: 'KUL', city: '쿠알라룸푸르', country: '말레이시아' },
    
    // 미국
    { name: '존 F. 케네디 국제공항', code: 'JFK', city: '뉴욕', country: '미국' },
    { name: '로스앤젤레스 국제공항', code: 'LAX', city: '로스앤젤레스', country: '미국' },
    { name: '샌프란시스코 국제공항', code: 'SFO', city: '샌프란시스코', country: '미국' },
    { name: '시카고 오헤어 국제공항', code: 'ORD', city: '시카고', country: '미국' },
    { name: '애틀랜타 국제공항', code: 'ATL', city: '애틀랜타', country: '미국' },
    { name: '호놀룰루 국제공항', code: 'HNL', city: '호놀룰루', country: '미국' },
    { name: '라스베이거스 국제공항', code: 'LAS', city: '라스베이거스', country: '미국' },
    
    // 유럽
    { name: '히드로 공항', code: 'LHR', city: '런던', country: '영국' },
    { name: '개트윅 공항', code: 'LGW', city: '런던', country: '영국' },
    { name: '샤를 드골 공항', code: 'CDG', city: '파리', country: '프랑스' },
    { name: '프랑크푸르트 공항', code: 'FRA', city: '프랑크푸르트', country: '독일' },
    { name: '암스테르담 스키폴 공항', code: 'AMS', city: '암스테르담', country: '네덜란드' },
    { name: '로마 피우미치노 공항', code: 'FCO', city: '로마', country: '이탈리아' },
    { name: '바르셀로나 엘프라트 공항', code: 'BCN', city: '바르셀로나', country: '스페인' },
    { name: '마드리드 바라하스 공항', code: 'MAD', city: '마드리드', country: '스페인' },
    
    // 오세아니아
    { name: '시드니 킹스포드 스미스 공항', code: 'SYD', city: '시드니', country: '호주' },
    { name: '멜버른 공항', code: 'MEL', city: '멜버른', country: '호주' },
    { name: '오클랜드 공항', code: 'AKL', city: '오클랜드', country: '뉴질랜드' },
    
    // 중동
    { name: '두바이 국제공항', code: 'DXB', city: '두바이', country: '아랍에미리트' },
    { name: '아부다비 국제공항', code: 'AUH', city: '아부다비', country: '아랍에미리트' },
    { name: '도하 하마드 국제공항', code: 'DOH', city: '도하', country: '카타르' },
];

export default function SearchAirportScreen() {
    const { 
        planId, 
        type, 
        currentDate, 
        currentAirline, 
        currentFlightNumber,
        departureAirport,
        departureAirportCode,
        arrivalAirport,
        arrivalAirportCode,
    } = useLocalSearchParams<{
        planId: string;
        type: 'departure' | 'arrival';
        currentDate?: string;
        currentAirline?: string;
        currentFlightNumber?: string;
        departureAirport?: string;
        departureAirportCode?: string;
        arrivalAirport?: string;
        arrivalAirportCode?: string;
    }>();
    
    const { getTravelPlan } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    
    // 여행 계획의 목적지 정보 가져오기
    const travelPlan = planId ? getTravelPlan(planId) : undefined;
    const destination = travelPlan?.destination || '';

    const handleBack = () => {
        router.back();
    };

    // 검색 결과 필터링 및 정렬
    const searchResults = useMemo(() => {
        let results = AIRPORTS;
        
        // 검색어로 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = AIRPORTS.filter(
                (airport) =>
                    airport.name.toLowerCase().includes(query) ||
                    airport.city.toLowerCase().includes(query) ||
                    airport.code.toLowerCase().includes(query) ||
                    airport.country.toLowerCase().includes(query)
            );
        }
        
        // 정렬: 출발은 한국 공항 우선, 도착은 여행 목적지 도시 공항 우선
        return results.sort((a, b) => {
            if (type === 'departure') {
                // 출발: 한국 공항 우선
                if (a.country === '한국' && b.country !== '한국') return -1;
                if (a.country !== '한국' && b.country === '한국') return 1;
            } else {
                // 도착: 여행 목적지 도시의 공항 우선
                const aMatchesDestination = a.city.includes(destination) || destination.includes(a.city);
                const bMatchesDestination = b.city.includes(destination) || destination.includes(b.city);
                
                if (aMatchesDestination && !bMatchesDestination) return -1;
                if (!aMatchesDestination && bMatchesDestination) return 1;
                
                // 목적지 매칭이 같으면 한국이 아닌 공항 우선
                if (a.country !== '한국' && b.country === '한국') return -1;
                if (a.country === '한국' && b.country !== '한국') return 1;
            }
            return 0;
        });
    }, [searchQuery, type, destination]);

    const handleSelectAirport = (airport: Airport) => {
        // 선택한 공항 정보를 가지고 항공편 추가 화면으로 이동
        // 기존 공항 정보를 유지하면서 새로운 공항 정보 추가
        const params: any = {
            planId,
            departureDate: currentDate,
            airline: currentAirline,
            flightNumber: currentFlightNumber,
        };

        // 출발 공항 선택 시
        if (type === 'departure') {
            params.departureAirport = airport.name;
            params.departureAirportCode = airport.code;
            // 기존 도착 공항 정보 유지
            if (arrivalAirport) params.arrivalAirport = arrivalAirport;
            if (arrivalAirportCode) params.arrivalAirportCode = arrivalAirportCode;
        } 
        // 도착 공항 선택 시
        else {
            params.arrivalAirport = airport.name;
            params.arrivalAirportCode = airport.code;
            // 기존 출발 공항 정보 유지
            if (departureAirport) params.departureAirport = departureAirport;
            if (departureAirportCode) params.departureAirportCode = departureAirportCode;
        }

        router.back();
        router.replace({
            pathname: '/add-flight',
            params,
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
                            placeholder={type === 'departure' ? '출발 공항 검색' : '도착 공항 검색'}
                            placeholderTextColor="#585858"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        <Feather name="search" size={16} color="#585858" />
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 검색 결과 리스트 */}
                {searchResults.length > 0 ? (
                    <View style={styles.resultsSection}>
                        {searchResults.map((airport, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.resultCard}
                                onPress={() => handleSelectAirport(airport)}
                            >
                                <View style={styles.resultInfo}>
                                    <View style={styles.resultMainInfo}>
                                        <Text style={styles.resultName}>{airport.name}</Text>
                                        <Text style={styles.resultCode}>{airport.code}</Text>
                                    </View>
                                    <Text style={styles.resultLocation}>
                                        {airport.city}, {airport.country}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
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
    resultsSection: {
        paddingTop: 16,
        gap: 16,
    },
    resultCard: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ECECEC',
    },
    resultInfo: {
        gap: 4,
    },
    resultMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    resultName: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    resultCode: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        fontWeight: '700',
        color: '#088CDA',
        marginLeft: 12,
    },
    resultLocation: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.15,
        color: '#585858',
    },
    emptyContainer: {
        paddingVertical: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#585858',
    },
});

