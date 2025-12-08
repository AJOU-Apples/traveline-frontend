import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useUser } from '../src/context/UserContext';

export default function AccommodationDateSelectionScreen() {
    const { planId, name, address, latitude, longitude } = useLocalSearchParams<{
        planId: string;
        name?: string;
        address?: string;
        latitude?: string;
        longitude?: string;
    }>();

    const { getTravelPlan } = useUser();
    const [checkInDate, setCheckInDate] = useState<string | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<string | null>(null);

    // 여행 계획의 날짜 범위 가져오기
    const travelDateRange = useMemo(() => {
        if (!planId) return null;
        const plan = getTravelPlan(planId);
        if (!plan) return null;

        // YYYY.MM.DD 형식을 YYYY-MM-DD 형식으로 변환
        const startDate = plan.startDate.replace(/\./g, '-');
        const endDate = plan.endDate.replace(/\./g, '-');

        return { startDate, endDate };
    }, [planId, getTravelPlan]);

    const handleBack = () => {
        router.back();
    };

    const handleDayPress = (day: DateData) => {
        const selectedDate = day.dateString;

        // 여행 기간 내 날짜인지 검증
        if (travelDateRange) {
            const selected = new Date(selectedDate);
            const start = new Date(travelDateRange.startDate);
            const end = new Date(travelDateRange.endDate);

            if (selected < start || selected > end) {
                Alert.alert('알림', '여행 기간 내의 날짜만 선택할 수 있습니다.');
                return;
            }
        }

        // 체크인이 선택되지 않았거나, 체크인과 체크아웃 모두 선택된 경우
        if (!checkInDate || (checkInDate && checkOutDate)) {
            setCheckInDate(selectedDate);
            setCheckOutDate(null);
            return;
        }

        // 체크인만 선택된 경우
        if (checkInDate && !checkOutDate) {
            // 선택한 날짜가 체크인보다 이전이면 체크인을 변경
            if (new Date(selectedDate) < new Date(checkInDate)) {
                setCheckInDate(selectedDate);
                setCheckOutDate(null);
            } else {
                // 선택한 날짜가 체크인과 같거나 이후면 체크아웃으로 설정
                setCheckOutDate(selectedDate);
            }
        }
    };

    const getMarkedDates = () => {
        const marked: any = {};

        if (checkInDate && checkOutDate) {
            const start = new Date(checkInDate);
            const end = new Date(checkOutDate);
            const currentDate = new Date(start);

            while (currentDate <= end) {
                const dateString = currentDate.toISOString().split('T')[0];

                if (dateString === checkInDate && dateString === checkOutDate) {
                    // 체크인과 체크아웃이 같은 경우
                    marked[dateString] = {
                        selected: true,
                        selectedColor: '#088CDA',
                        selectedTextColor: '#fff',
                    };
                } else if (dateString === checkInDate) {
                    // 체크인 날짜
                    marked[dateString] = {
                        startingDay: true,
                        color: '#088CDA',
                        textColor: '#fff',
                    };
                } else if (dateString === checkOutDate) {
                    // 체크아웃 날짜
                    marked[dateString] = {
                        endingDay: true,
                        color: '#088CDA',
                        textColor: '#fff',
                    };
                } else {
                    // 중간 날짜
                    marked[dateString] = {
                        color: '#E3F2FD',
                        textColor: '#000',
                    };
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else if (checkInDate && !checkOutDate) {
            marked[checkInDate] = {
                startingDay: true,
                endingDay: true,
                color: '#088CDA',
                textColor: '#fff',
            };
        }

        return marked;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    };

    const formatDateRange = (checkIn: string | null, checkOut: string | null): string => {
        if (!checkIn || !checkOut) return '날짜를 선택해주세요';
        return `${formatDate(checkIn)} ~ ${formatDate(checkOut)} 날짜로 등록`;
    };

    const handleRegister = () => {
        if (!checkInDate || !checkOutDate) {
            Alert.alert('알림', '체크인/체크아웃 날짜를 선택해주세요.');
            return;
        }

        // 이전 화면으로 돌아가면서 날짜 정보 전달
        router.back();
        // URL 파라미터로 날짜를 전달하기 위해 다시 이동
        router.replace({
            pathname: '/add-accommodation',
            params: {
                planId,
                name,
                address,
                latitude,
                longitude,
                checkInDate,
                checkOutDate,
            },
        });
    };

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* 제목 */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>숙소 날짜 선택</Text>
                {travelDateRange && (
                    <Text style={styles.travelPeriod}>
                        여행 기간: {formatDate(travelDateRange.startDate)} ~ {formatDate(travelDateRange.endDate)}
                    </Text>
                )}
            </View>

            {/* 캘린더 */}
            <Calendar
                current={travelDateRange?.startDate || new Date().toISOString().split('T')[0]}
                minDate={travelDateRange?.startDate || new Date().toISOString().split('T')[0]}
                maxDate={travelDateRange?.endDate}
                onDayPress={handleDayPress}
                markedDates={getMarkedDates()}
                markingType="period"
                theme={{
                    backgroundColor: '#fff',
                    calendarBackground: '#fff',
                    textSectionTitleColor: '#9E9E9E',
                    selectedDayBackgroundColor: '#088CDA',
                    selectedDayTextColor: '#fff',
                    todayTextColor: '#176ADA',
                    dayTextColor: '#000',
                    textDisabledColor: '#E0E0E0',
                    monthTextColor: '#000',
                    textMonthFontSize: 18,
                    textMonthFontWeight: '600' as any,
                    textDayFontSize: 16,
                    textDayHeaderFontSize: 14,
                }}
                style={styles.calendar}
            />

            {/* 하단 확인 버튼 */}
            {checkInDate && checkOutDate && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleRegister}>
                        <Text style={styles.confirmButtonText}>
                            {formatDateRange(checkInDate, checkOutDate)}
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
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 24,
        height: 24,
    },
    titleContainer: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    travelPeriod: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.15,
        color: '#585858',
    },
    calendar: {
        paddingHorizontal: 16,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    confirmButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

