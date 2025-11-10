import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Dimensions,
    Animated,
    PanResponder
} from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
import { useUser } from '../src/context/UserContext';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Place } from '../src/context/UserContext';

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

// Google Directions API에서 반환된 polyline 디코딩
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    const poly: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        poly.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return poly;
}

// Google Directions API를 사용하여 두 지점 간 경로 가져오기
async function fetchRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    apiKey: string
): Promise<{ latitude: number; longitude: number }[]> {
    try {
        const originStr = `${origin.latitude},${origin.longitude}`;
        const destStr = `${destination.latitude},${destination.longitude}`;

        // 두 지점 간 거리 계산 (km)
        const distance = calculateDistance(
            origin.latitude,
            origin.longitude,
            destination.latitude,
            destination.longitude
        );

        // 거리에 따라 이동 수단 자동 선택
        // 2km 이하: 도보, 초과: 대중교통
        const mode = distance <= 2 ? 'walking' : 'transit';

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=${mode}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
            const points = data.routes[0].overview_polyline.points;
            return decodePolyline(points);
        }

        if (data.routes.length === 0) {
            const walkingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=walking&key=${apiKey}`;
            const walkingResponse = await fetch(walkingUrl);
            const walkingData = await walkingResponse.json();
            if (walkingData.status === 'OK' && walkingData.routes.length > 0) {
                const walkingPoints = walkingData.routes[0].overview_polyline.points;
                return decodePolyline(walkingPoints);
            }
        }

        // API 호출 실패 시 직선 반환
        return [origin, destination];
    } catch (error) {
        console.error('Route fetch error:', error);
        // 에러 발생 시 직선 반환
        return [origin, destination];
    }
}

// Google Maps API 키 (app.json에서 가져오기)
const GOOGLE_MAPS_API_KEY = Platform.select({
    ios: Constants.expoConfig?.ios?.config?.googleMapsApiKey,
    android: Constants.expoConfig?.android?.config?.googleMaps?.apiKey,
}) || 'AIzaSyCoD_272LfO6ENbwlzvrnlJlvPh6ysLKSs'; // Fallback

export default function PlanDetailScreen() {
    const { planId } = useLocalSearchParams<{ planId: string }>();
    const { getTravelPlan, reorderPlaces, getFlightsByPlan, getAccommodationsByPlan } = useUser();
    const [selectedDay, setSelectedDay] = useState(1);
    const [isEditMode, setIsEditMode] = useState(false);

    // 저장된 여행 데이터 불러오기
    const tripData = getTravelPlan(planId || '');

    // 항공편과 숙소 데이터 불러오기
    const flights = planId ? getFlightsByPlan(planId) : [];
    const accommodations = planId ? getAccommodationsByPlan(planId) : [];

    // 선택된 항공편과 숙소 찾기
    const selectedFlight = flights.find(f => f.isSelected);
    const selectedAccommodation = accommodations.find(a => a.isSelected);

    // 목적지에 따른 통화 기호 반환
    const getCurrencySymbol = () => {
        const destination = tripData?.destination || '';

        if (destination.includes('일본') || destination.includes('도쿄') || destination.includes('오사카') || destination.includes('교토') || destination.includes('후쿠오카') || destination.includes('가고시마') || destination.includes('삿포로') || destination.includes('시즈오카') || destination.includes('나고야') || destination.includes('오키나와') || destination.includes('마쓰야마') || destination.includes('구마모토') || destination.includes('고베')) {
            return '¥';
        } else if (destination.includes('미국') || destination.includes('뉴욕') || destination.includes('LA') || destination.includes('샌프란시스코') || destination.includes('로스앤젤레스') || destination.includes('라스베이거스') || destination.includes('하와이')) {
            return '$';
        } else if (destination.includes('유럽') || destination.includes('파리') || destination.includes('런던') || destination.includes('독일') || destination.includes('로마') || destination.includes('바르셀로나') || destination.includes('암스테르담') || destination.includes('베를린') || destination.includes('하이델베르크') || destination.includes('프라하')) {
            return '€';
        } else if (destination.includes('중국') || destination.includes('베이징') || destination.includes('상하이')) {
            return '¥';
        } else if (destination.includes('태국') || destination.includes('방콕') || destination.includes('치앙마이') || destination.includes('푸켓')) {
            return '฿';
        } else if (destination.includes('베트남') || destination.includes('호치민') || destination.includes('하노이') || destination.includes('나트랑') || destination.includes('하롱비') || destination.includes('다낭')) {
            return '₫';
        } else if (destination.includes('싱가포르')) {
            return 'S$';
        } else if (destination.includes('두바이')) {
            return 'AED';
        } else if (destination.includes('시드니') || destination.includes('멜버른')) {
            return 'A$';
        }

        return '₩'; // 기본값: 한국 원화
    };

    // 장소의 총 지출 계산
    const calculateTotalExpense = (place: Place): number => {
        if (!place.expenses || place.expenses.length === 0) {
            return 0;
        }
        return place.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    };

    // 지도 영역 높이 애니메이션
    const mapHeight = useRef(new Animated.Value(INITIAL_MAP_HEIGHT)).current;
    const currentHeight = useRef(INITIAL_MAP_HEIGHT);

    // 지도 ref
    const mapRef = useRef<MapView>(null);

    // 실제 경로 데이터 저장
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);

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

    // 실제 경로 가져오기
    useEffect(() => {
        const fetchRoutes = async () => {
            const validMarkers = markers.filter(
                place => place.latitude && place.longitude
            );

            if (validMarkers.length < 2) {
                setRouteCoordinates([]);
                return;
            }

            // 모든 구간의 경로를 가져와서 하나로 합치기
            const allRouteCoordinates: { latitude: number; longitude: number }[] = [];

            for (let i = 0; i < validMarkers.length - 1; i++) {
                const origin = {
                    latitude: validMarkers[i].latitude!,
                    longitude: validMarkers[i].longitude!,
                };
                const destination = {
                    latitude: validMarkers[i + 1].latitude!,
                    longitude: validMarkers[i + 1].longitude!,
                };

                const routeSegment = await fetchRoute(origin, destination, GOOGLE_MAPS_API_KEY);

                // 첫 번째 구간이 아니면 시작점 중복 제거
                if (i > 0 && routeSegment.length > 0) {
                    allRouteCoordinates.push(...routeSegment.slice(1));
                } else {
                    allRouteCoordinates.push(...routeSegment);
                }
            }

            setRouteCoordinates(allRouteCoordinates);
        };

        fetchRoutes();
    }, [markers]);

    // 장소가 추가되거나 변경될 때 지도 확대 자동 조정
    useEffect(() => {
        if (!mapRef.current) return;

        if (markers.length > 0) {
            const validMarkers = markers.filter(
                place => place.latitude && place.longitude
            );

            if (validMarkers.length > 0) {
                const coordinates = validMarkers.map(place => ({
                    latitude: place.latitude!,
                    longitude: place.longitude!,
                }));

                // 약간의 딜레이를 주어 지도가 렌더링된 후 실행
                setTimeout(() => {
                    mapRef.current?.fitToCoordinates(coordinates, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true,
                    });
                }, 500);
            }
        } else {
            // 장소가 없을 때는 기본 좌표로 이동
            setTimeout(() => {
                mapRef.current?.animateToRegion(initialRegion, 500);
            }, 300);
        }
    }, [markers, initialRegion]);

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

    const handleFlightsPress = () => {
        router.push({
            pathname: '/flights',
            params: {
                planId: planId || '',
            },
        });
    };

    const handleAccommodationsPress = () => {
        router.push({
            pathname: '/accommodations',
            params: {
                planId: planId || '',
            },
        });
    };

    // 장소 카드 렌더링 함수
    const renderPlaceItem = ({ item: place, getIndex, drag, isActive }: RenderItemParams<Place>) => {
        const currentDayData = tripData.days.find(day => day.dayNumber === selectedDay);
        if (!currentDayData) return null;

        const index = getIndex();
        if (index === undefined) return null;

        return (
            <ScaleDecorator>
                <View
                    style={[
                        styles.placeCardContainer,
                        isActive && styles.placeCardDragging,
                    ]}
                >
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
                                            if (distance < 1) {
                                                return `${Math.round(distance * 1000)}m`;
                                            }
                                            return `${distance.toFixed(1)}km`;
                                        }
                                        return '';
                                    })()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* 카드 내용 */}
                    <TouchableOpacity
                        style={styles.placeCard}
                        onPress={() => {
                            if (!isEditMode) {
                                router.push({
                                    pathname: '/place-detail',
                                    params: {
                                        planId: planId || '',
                                        dayNumber: selectedDay.toString(),
                                        placeId: place.id,
                                    },
                                });
                            }
                        }}
                        disabled={isEditMode}
                    >
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
                                <Text style={styles.placeExpense}>
                                    지출 총합 {calculateTotalExpense(place).toLocaleString()}{getCurrencySymbol()}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* 리오더 핸들 (편집 모드일 때만 표시) */}
                    {isEditMode && (
                        <TouchableOpacity
                            style={styles.reorderHandle}
                            onLongPress={drag}
                            disabled={!isEditMode || isActive}
                        >
                            <MaterialIcons
                                name="reorder"
                                size={24}
                                color={isActive ? '#088CDA' : '#C7C7C7'}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </ScaleDecorator>
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
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
                    <TouchableOpacity
                        style={[
                            styles.quickActionButton,
                            selectedFlight && styles.quickActionButtonFilled
                        ]}
                        onPress={handleFlightsPress}
                    >
                        {!selectedFlight ? (
                            <>
                                <View style={styles.iconCircle}>
                                    <Feather name="plus" size={10} color="#C7C7C7" />
                                </View>
                                <Text style={styles.quickActionText}>항공편</Text>
                            </>
                        ) : (
                            <Text style={styles.quickActionText}>항공편</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.quickActionButton,
                            selectedAccommodation && styles.quickActionButtonFilled
                        ]}
                        onPress={handleAccommodationsPress}
                    >
                        {!selectedAccommodation ? (
                            <>
                                <View style={styles.iconCircle}>
                                    <Feather name="plus" size={10} color="#C7C7C7" />
                                </View>
                                <Text style={styles.quickActionText}>숙소</Text>
                            </>
                        ) : (
                            <Text style={styles.quickActionText}>숙소</Text>
                        )}
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
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                >
                    {/* 장소들 사이의 실제 경로선 */}
                    {routeCoordinates.length > 0 && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeColor="#088CDA"
                            strokeWidth={5}
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}

                    {/* 마커들 */}
                    {markers
                        .filter(place => place.latitude && place.longitude)
                        .map((place, index) => {
                            const validMarkers = markers.filter(p => p.latitude && p.longitude);
                            const markerIndex = validMarkers.findIndex(p => p.id === place.id);

                            return (
                                <Marker
                                    key={place.id}
                                    coordinate={{
                                        latitude: place.latitude!,
                                        longitude: place.longitude!,
                                    }}
                                    title={place.name}
                                    description={place.address}
                                >
                                    <View style={styles.customMarker}>
                                        <Text style={styles.markerNumber}>{markerIndex + 1}</Text>
                                    </View>
                                </Marker>
                            );
                        })}
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
                    <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
                        <Text style={styles.editText}>{isEditMode ? '완료' : '편집'}</Text>
                    </TouchableOpacity>
                </View>

                {/* 편집 모드 안내 */}
                {isEditMode && currentDayData && currentDayData.places.length > 0 && (
                    <View style={styles.editModeHint}>
                        <MaterialIcons name="info-outline" size={16} color="#088CDA" />
                        <Text style={styles.editModeHintText}>
                            리오더 아이콘(≡)을 길게 눌러 드래그하여 순서를 변경하세요
                        </Text>
                    </View>
                )}

                {/* 일정 내용 */}
                <View style={styles.scheduleContentContainer}>
                    {currentDayData?.places.length === 0 ? (
                        <ScrollView
                            style={styles.scheduleContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.emptyPlaces}>
                                <Text style={styles.emptyPlacesText}>아직 추가된 장소가 없습니다</Text>
                            </View>
                            {/* 장소 추가 버튼 */}
                            <TouchableOpacity style={styles.addPlaceButton} onPress={handleAddPlace}>
                                <Feather name="plus" size={12} color="#fff" />
                                <Text style={styles.addPlaceText}>장소 추가</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    ) : (
                        <>
                            <DraggableFlatList
                                data={currentDayData?.places || []}
                                renderItem={renderPlaceItem}
                                keyExtractor={(item) => item.id}
                                onDragEnd={({ data, from, to }) => {
                                    if (from !== to && planId) {
                                        reorderPlaces(planId, selectedDay, from, to);
                                    }
                                }}
                                activationDistance={isEditMode ? 10 : 999999}
                                containerStyle={styles.draggableList}
                                contentContainerStyle={styles.draggableListContent}
                            />
                            {/* 장소 추가 버튼 */}
                            <View style={styles.addPlaceButtonContainer}>
                                <TouchableOpacity style={styles.addPlaceButton} onPress={handleAddPlace}>
                                    <Feather name="plus" size={12} color="#fff" />
                                    <Text style={styles.addPlaceText}>장소 추가</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
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
        </GestureHandlerRootView>
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
        paddingHorizontal: 8,
        height: 24,
    },
    quickActionButtonFilled: {
        backgroundColor: '#088CDA',
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
    scheduleContentContainer: {
        flex: 1,
    },
    scheduleContent: {
        flex: 1,
        paddingHorizontal: 21,
        paddingTop: 16,
    },
    draggableList: {
        flex: 1,
    },
    draggableListContent: {
        paddingHorizontal: 21,
        paddingTop: 16,
        paddingBottom: 16,
    },
    addPlaceButtonContainer: {
        paddingHorizontal: 21,
        paddingBottom: 24,
        backgroundColor: '#fff',
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
        marginTop: 8,
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
    reorderHandle: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    placeCardDragging: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    editModeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#E3F2FD',
        marginHorizontal: 21,
        marginTop: 8,
        borderRadius: 8,
    },
    editModeHintText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#088CDA',
        fontWeight: '500',
    },
    customMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#088CDA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    markerNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});

