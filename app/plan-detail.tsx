import React, { useState, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Animated, PanResponder } from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useUser } from '../src/context/UserContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MIN_MAP_HEIGHT = 0;
const MAX_MAP_HEIGHT = 200;
const INITIAL_MAP_HEIGHT = 180;

// Haversine formula를 사용한 두 좌표 간 거리 계산 (km 단위)
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

export default function PlanDetailScreen() {
    const { planId } = useLocalSearchParams<{ planId: string }>();
    const { getTravelPlan } = useUser();
    const [selectedDay, setSelectedDay] = useState(1);

    // 지도 영역 높이 애니메이션
    const mapHeight = useRef(new Animated.Value(INITIAL_MAP_HEIGHT)).current;
    const currentHeight = useRef(INITIAL_MAP_HEIGHT);

    // PanResponder 설정
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                // 아래로 드래그하면 지도가 커지고, 위로 드래그하면 작아짐
                const newHeight = Math.max(
                    MIN_MAP_HEIGHT,
                    Math.min(MAX_MAP_HEIGHT, currentHeight.current + gestureState.dy)
                );

                mapHeight.setValue(newHeight);
            },
            onPanResponderRelease: (_, gestureState) => {
                const newHeight = Math.max(
                    MIN_MAP_HEIGHT,
                    Math.min(MAX_MAP_HEIGHT, currentHeight.current + gestureState.dy)
                );

                currentHeight.current = newHeight;

                Animated.spring(mapHeight, {
                    toValue: newHeight,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 8,
                }).start();
            },
        })
    ).current;

    // 저장된 여행 데이터 불러오기
    const tripData = getTravelPlan(planId || '');

    if (!tripData) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Feather name="x" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#9E9E9E' }}>여행 계획을 찾을 수 없습니다</Text>
                </View>
            </View>
        );
    }

    const currentDayData = tripData.days.find(day => day.dayNumber === selectedDay);

    // 여행지별 초기 지도 좌표 (TODO: BE에서 받아오기)
    const defaultCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
        // 일본
        '도쿄': { latitude: 35.6812, longitude: 139.7671 },  // 도쿄역 중심
        '오사카': { latitude: 34.6937, longitude: 135.5023 },
        '후쿠오카': { latitude: 33.5904, longitude: 130.4017 },
        '가고시마': { latitude: 31.5969, longitude: 130.5571 },
        '삿포로': { latitude: 43.0642, longitude: 141.3469 },
        '시즈오카': { latitude: 34.9756, longitude: 138.3828 },
        '나고야': { latitude: 35.1815, longitude: 136.9066 },
        '오키나와': { latitude: 26.2124, longitude: 127.6809 },
        '마쓰야마': { latitude: 33.8392, longitude: 132.7658 },
        '구마모토': { latitude: 32.8031, longitude: 130.7079 },
        '고베': { latitude: 34.6901, longitude: 135.1955 },
        '교토': { latitude: 35.0116, longitude: 135.7681 },
        // 한국
        '서울': { latitude: 37.5665, longitude: 126.9780 },
        '부산': { latitude: 35.1796, longitude: 129.0756 },
        '제주': { latitude: 33.4996, longitude: 126.5312 },
        '강릉': { latitude: 37.7519, longitude: 128.8761 },
        '여수': { latitude: 34.7604, longitude: 127.6622 },
        '경주': { latitude: 35.8562, longitude: 129.2247 },
        // 동남아
        '방콕': { latitude: 13.7563, longitude: 100.5018 },
        '싱가포르': { latitude: 1.3521, longitude: 103.8198 },
        '나트랑': { latitude: 12.2388, longitude: 109.1967 },
        '마닐라': { latitude: 14.5995, longitude: 120.9842 },
        '미얀마': { latitude: 21.9162, longitude: 95.9560 },  // 양곤
        '치앙마이': { latitude: 18.7883, longitude: 98.9853 },
        '하노이': { latitude: 21.0285, longitude: 105.8542 },
        '하롱비': { latitude: 20.9101, longitude: 107.1839 },
        '호치민': { latitude: 10.8231, longitude: 106.6297 },
        '다낭': { latitude: 16.0544, longitude: 108.2022 },
        '푸켓': { latitude: 7.8804, longitude: 98.3923 },
        // 유럽
        '파리': { latitude: 48.8566, longitude: 2.3522 },
        '런던': { latitude: 51.5074, longitude: -0.1278 },
        '로마': { latitude: 41.9028, longitude: 12.4964 },
        '바르셀로나': { latitude: 41.3874, longitude: 2.1686 },
        '암스테르담': { latitude: 52.3676, longitude: 4.9041 },
        '베를린': { latitude: 52.5200, longitude: 13.4050 },
        '하이델베르크': { latitude: 49.3988, longitude: 8.6724 },
        '프라하': { latitude: 50.0755, longitude: 14.4378 },
        // 미국
        '뉴욕': { latitude: 40.7128, longitude: -74.0060 },
        '샌프란시스코': { latitude: 37.7749, longitude: -122.4194 },
        '로스앤젤레스': { latitude: 34.0522, longitude: -118.2437 },
        '라스베이거스': { latitude: 36.1699, longitude: -115.1398 },
        '하와이': { latitude: 21.3099, longitude: -157.8581 },  // 호놀룰루
        // 기타
        '시드니': { latitude: -33.8688, longitude: 151.2093 },
        '멜버른': { latitude: -37.8136, longitude: 144.9631 },
        '두바이': { latitude: 25.2048, longitude: 55.2708 },
    };

    // 여행지 이름에서 좌표 추출 (기본값: 서울)
    const initialRegion = useMemo(() => {
        const destination = tripData.destination;
        const coords = defaultCoordinates[destination] || { latitude: 37.5665, longitude: 126.9780 };
        return {
            ...coords,
            latitudeDelta: 0.02,  // 더 확대된 뷰
            longitudeDelta: 0.02, // 더 확대된 뷰
        };
    }, [tripData.destination]);

    // 선택한 일차의 장소들을 마커로 표시
    const markers = useMemo(() => {
        return currentDayData?.places || [];
    }, [currentDayData]);

    const handleClose = () => {
        // 모든 모달을 닫고 홈 화면으로 이동
        router.dismissAll();
    };

    const handleAddPlace = () => {
        // 목적지 좌표 정보 전달
        const destinationCoords = defaultCoordinates[tripData.destination] || defaultCoordinates['서울'];

        router.push({
            pathname: '/add-place',
            params: {
                planId: planId || '',
                dayNumber: selectedDay.toString(),
                destination: tripData.destination,
                latitude: destinationCoords.latitude.toString(),
                longitude: destinationCoords.longitude.toString(),
            },
        });
    };

    const handleChecklistPress = () => {
        router.push({
            pathname: '/checklist',
            params: {
                planId: planId || '',
            },
        });
    };

    return (
        <View style={styles.container}>
            {/* 상단 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                    <Feather name="more-horizontal" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* 상단 타이틀 영역 */}
            <View style={styles.titleSection}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{tripData.title}</Text>
                    <Text style={styles.editButton}>편집</Text>
                </View>
                <Text style={styles.dateRange}>
                    {tripData.startDate} - {tripData.endDate}
                </Text>

                {/* 항공편/숙소 버튼 */}
                <View style={styles.quickActionsRow}>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <View style={styles.iconCircle}>
                            <Feather name="plus" size={10} color="#C7C7C7" />
                        </View>
                        <Text style={styles.quickActionText}>항공편</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <View style={styles.iconCircle}>
                            <Feather name="plus" size={10} color="#C7C7C7" />
                        </View>
                        <Text style={styles.quickActionText}>숙소</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.participantsRow}>
                    <View style={styles.participantAvatars}>
                        <View style={styles.avatar}>
                            <MaterialIcons name="account-circle" size={32} color="#9E9E9E" />
                        </View>
                        <View style={styles.moreAvatar}>
                            <Feather name="more-horizontal" size={12} color="#fff" />
                        </View>
                    </View>
                    <View style={styles.participantBadge}>
                        <Text style={styles.participantText}>{tripData.participants}명 참여중</Text>
                    </View>
                </View>
            </View>

            {/* 지도 영역 */}
            <Animated.View style={[styles.mapSection, { height: mapHeight }]}>
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                >
                    {markers
                        .filter(place => place.latitude && place.longitude)
                        .map((place, index) => (
                            <Marker
                                key={place.id}
                                coordinate={{
                                    latitude: place.latitude!,
                                    longitude: place.longitude!,
                                }}
                                title={place.name}
                                description={place.address}
                            />
                        ))}
                </MapView>
            </Animated.View>

            {/* 하단 일정 영역 */}
            <Animated.View style={styles.scheduleSection}>
                {/* 핸들 */}
                <View style={styles.handleTouchArea} {...panResponder.panHandlers}>
                    <View style={styles.handle} />
                </View>

                {/* 일차 탭 */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.dayTabsScrollView}
                    contentContainerStyle={styles.dayTabs}
                >
                    {tripData.days.map((day) => (
                        <TouchableOpacity
                            key={day.id}
                            onPress={() => setSelectedDay(day.dayNumber)}
                            style={[
                                styles.dayTab,
                                selectedDay === day.dayNumber && styles.dayTabActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.dayTabText,
                                    selectedDay === day.dayNumber && styles.dayTabTextActive,
                                ]}
                            >
                                {day.dayNumber}일차
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 일정 헤더 (sticky) */}
                <View style={styles.dayHeader}>
                    <View style={styles.dayInfo}>
                        <Text style={styles.dayLabel}>{currentDayData?.dayNumber}일차</Text>
                        <Text style={styles.dayDate}>{currentDayData?.displayDate}</Text>
                    </View>
                    <Text style={styles.editText}>편집</Text>
                </View>

                {/* 일정 내용 */}
                <ScrollView
                    style={styles.scheduleContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 장소 리스트 */}
                    {currentDayData?.places.length === 0 ? (
                        <View style={styles.emptyPlaces}>
                            <Text style={styles.emptyPlacesText}>아직 추가된 장소가 없습니다</Text>
                        </View>
                    ) : (
                        <View style={styles.placesList}>
                            {currentDayData?.places.map((place, index) => (
                                <React.Fragment key={place.id}>
                                    {/* 장소 카드 */}
                                    <View style={styles.placeCardContainer}>
                                        {/* 번호와 연결선 */}
                                        <View style={styles.placeLeftSection}>
                                            <View style={styles.placeNumber}>
                                                <Text style={styles.placeNumberText}>{index + 1}</Text>
                                            </View>
                                            <View style={[
                                                styles.connectionLineContainer,
                                                index === currentDayData.places.length - 1 && styles.lastConnectionLine
                                            ]}>
                                                <View style={styles.connectionLine} />
                                                {/* 거리 표시 (마지막 항목은 투명) */}
                                                <View style={[
                                                    styles.distanceBadge,
                                                    index === currentDayData.places.length - 1 && { opacity: 0 }
                                                ]}>
                                                    <Text style={styles.distanceText}>
                                                        {(() => {
                                                            // 다음 장소가 있고 둘 다 좌표가 있으면 실제 거리 계산
                                                            const nextPlace = currentDayData.places[index + 1];
                                                            if (nextPlace &&
                                                                place.latitude && place.longitude &&
                                                                nextPlace.latitude && nextPlace.longitude) {
                                                                const distance = calculateDistance(
                                                                    place.latitude,
                                                                    place.longitude,
                                                                    nextPlace.latitude,
                                                                    nextPlace.longitude
                                                                );
                                                                // 1km 미만이면 미터 단위로 표시
                                                                if (distance < 1) {
                                                                    return `${Math.round(distance * 1000)}m`;
                                                                }
                                                                return `${distance.toFixed(1)}km`;
                                                            }
                                                            // 좌표가 없으면 빈 문자열 (레이아웃 유지)
                                                            return '';
                                                        })()}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* 카드 내용 */}
                                        <View style={styles.placeCard}>
                                            <View style={styles.placeCardInner}>
                                                {/* 시간 표시 (왼쪽) */}
                                                {place.time && (
                                                    <Text style={styles.placeTimeLeft}>{place.time}</Text>
                                                )}

                                                {/* 장소 정보 */}
                                                <View style={styles.placeMainInfo}>
                                                    <Text style={styles.placeName}>{place.name}</Text>
                                                    {place.address && (
                                                        <Text style={styles.placeAddress} numberOfLines={1}>
                                                            {place.address}
                                                        </Text>
                                                    )}
                                                    {place.time && (
                                                        <Text style={styles.placeTimeInCard}>{place.time}</Text>
                                                    )}
                                                </View>

                                                {/* 하단 정보 (좋아요, 지출) */}
                                                <View style={styles.placeBottomInfo}>
                                                    <View style={styles.placeLikeSection}>
                                                        <Feather name="heart" size={12} color="#000" />
                                                        <Text style={styles.placeLikeText}>좋아요</Text>
                                                        <Text style={styles.placeLikeCount}>0</Text>
                                                    </View>
                                                    <Text style={styles.placeExpense}>지출 총합 0엔</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </React.Fragment>
                            ))}
                        </View>
                    )}

                    {/* 장소 추가 버튼 */}
                    <TouchableOpacity style={styles.addPlaceButton} onPress={handleAddPlace}>
                        <Feather name="plus" size={12} color="#fff" />
                        <Text style={styles.addPlaceText}>장소 추가</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>

            {/* 하단 네비게이션 바 */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="calendar-today" size={30} color="#088CDA" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={handleChecklistPress}>
                    <MaterialIcons name="card-travel" size={32} color="#9E9E9E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="receipt" size={32} color="#9E9E9E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="chat" size={32} color="#9E9E9E" />
                </TouchableOpacity>
            </View>
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
        paddingTop: 24,
        paddingBottom: 8,
        backgroundColor: '#F6F6F6',
    },
    closeButton: {
        width: 24,
        height: 24,
    },
    moreButton: {
        width: 24,
        height: 24,
    },
    titleSection: {
        backgroundColor: '#F6F6F6',
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
        letterSpacing: -0.3,
        color: '#000',
    },
    editButton: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    dateRange: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#585858',
        marginBottom: 8,
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    quickActionButton: {
        backgroundColor: '#C7C7C7',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 6,
        height: 24,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
    },
    iconCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    participantAvatars: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    moreAvatar: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#C7C7C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -11,
    },
    participantBadge: {
        backgroundColor: '#C7C7C7',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 24,
        justifyContent: 'center',
    },
    participantText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
    },
    mapSection: {
        backgroundColor: '#F5F5F5',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    scheduleSection: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        justifyContent: 'flex-start',
    },
    handle: {
        width: 40,
        height: 3,
        backgroundColor: '#C7C7C7',
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    handleTouchArea: {
        paddingVertical: 8,
        paddingHorizontal: 40,
        alignSelf: 'center',
    },
    dayTabsScrollView: {
        marginBottom: 16,
        paddingBottom: 10,
        flexGrow: 0,
    },
    dayTabs: {
        paddingHorizontal: 21,
        gap: 8,
    },
    dayTab: {
        backgroundColor: '#C7C7C7',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayTabActive: {
        backgroundColor: '#088CDA',
    },
    dayTabText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
    },
    dayTabTextActive: {
        color: '#fff',
    },
    scheduleContent: {
        flex: 1,
        paddingHorizontal: 21,
        paddingTop: 16,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 21,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dayInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
    },
    dayDate: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    editText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
    },
    addPlaceButton: {
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
        marginTop: 16,
        marginBottom: 24,
    },
    addPlaceText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
    },
    emptyPlaces: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyPlacesText: {
        fontSize: 14,
        color: '#9E9E9E',
    },
    placesList: {
        marginTop: 0,
    },
    placeCardContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    placeLeftSection: {
        alignItems: 'center',
        marginRight: 30,
        flexShrink: 0,
        marginLeft: 10,
        position: 'relative',
        alignSelf: 'stretch',
    },
    placeNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#088CDA',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        zIndex: 1,
    },
    placeNumberText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
        lineHeight: 16,
        letterSpacing: -0.15,
    },
    connectionLineContainer: {
        position: 'absolute',
        top: 0,
        bottom: -16,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lastConnectionLine: {
        bottom: 0,
    },
    connectionLine: {
        position: 'absolute',
        width: 2,
        height: '100%',
        backgroundColor: '#C7C7C7',
        top: 0,
        left: '50%',
        marginLeft: -0.5,
    },
    placeCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    placeCardInner: {
        padding: 16,
        position: 'relative',
    },
    placeTimeLeft: {
        position: 'absolute',
        left: -45,
        top: 12,
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    placeMainInfo: {
        marginBottom: 16,
    },
    placeName: {
        fontSize: 16,
        fontWeight: '400',
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
        marginBottom: 4,
    },
    placeTimeInCard: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    placeBottomInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    placeLikeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    placeLikeText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
    },
    placeLikeCount: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    placeExpense: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    distanceBadge: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#C7C7C7',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 4,
        marginTop: 20,
        zIndex: 1,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    distanceText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
        textAlign: 'center',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingHorizontal: 40,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        height: Platform.OS === 'ios' ? 102 : 72,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

