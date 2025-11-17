import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useUser, TravelDay } from '../src/context/UserContext';

export default function DateSelectionScreen() {
    const { destinationId, destinationName } = useLocalSearchParams<{ destinationId: string; destinationName: string }>();
    const { addTravelPlan } = useUser();
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);

    const handleDayPress = (day: DateData) => {
        const selectedDate = day.dateString;

        // 시작일이 선택되지 않았거나, 시작일과 종료일 모두 선택된 경우
        if (!startDate || (startDate && endDate)) {
            setStartDate(selectedDate);
            setEndDate(null);
            return;
        }

        // 시작일만 선택된 경우
        if (startDate && !endDate) {
            // 선택한 날짜가 시작일보다 이전이면 시작일을 변경
            if (new Date(selectedDate) < new Date(startDate)) {
                setStartDate(selectedDate);
                setEndDate(null);
            } else {
                // 선택한 날짜가 시작일과 같거나 이후면 종료일로 설정
                setEndDate(selectedDate);
            }
        }
    };

    const getMarkedDates = () => {
        const marked: any = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const currentDate = new Date(start);

            while (currentDate <= end) {
                const dateString = currentDate.toISOString().split('T')[0];

                if (dateString === startDate && dateString === endDate) {
                    // 시작일과 종료일이 같은 경우
                    marked[dateString] = {
                        selected: true,
                        selectedColor: '#6ac2f7',
                        selectedTextColor: '#000',
                    };
                } else if (dateString === startDate) {
                    // 시작일
                    marked[dateString] = {
                        startingDay: true,
                        color: '#6ac2f7',
                        textColor: '#000',
                    };
                } else if (dateString === endDate) {
                    // 종료일
                    marked[dateString] = {
                        endingDay: true,
                        color: '#6ac2f7',
                        textColor: '#000',
                    };
                } else {
                    // 중간 날짜
                    marked[dateString] = {
                        color: '#6ac2f7',
                        textColor: '#000',
                    };
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else if (startDate && !endDate) {
            marked[startDate] = {
                startingDay: true,
                endingDay: true,
                color: '#6ac2f7',
                textColor: '#000',
            };
        }

        return marked;
    };

    const handleConfirm = async () => {
        if (startDate && endDate && destinationId && destinationName) {
            try {
                // 날짜 사이의 일수 계산
                const start = new Date(startDate);
                const end = new Date(endDate);
                const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // 일차별 데이터 생성
                const days: TravelDay[] = [];
                for (let i = 0; i < dayCount; i++) {
                    const currentDate = new Date(start);
                    currentDate.setDate(start.getDate() + i);

                    const dateString = currentDate.toISOString().split('T')[0];
                    const month = currentDate.getMonth() + 1;
                    const day = currentDate.getDate();
                    const weekday = ['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()];

                    days.push({
                        id: `day_${i + 1}`,
                        dayNumber: i + 1,
                        date: dateString,
                        displayDate: `${month}월 ${day}일(${weekday})`,
                        places: [],
                    });
                }

                // 여행 계획 생성
                const planId = await addTravelPlan({
                    title: `${destinationName} 여행`,
                    destination: destinationName,
                    destinationId: parseInt(destinationId),
                    startDate: formatDate(startDate),
                    endDate: formatDate(endDate),
                    participants: 1,
                    days,
                });

                console.log('Created travel plan:', { planId, destinationId, destinationName, startDate, endDate });

                // 여행 계획 상세 화면으로 이동
                router.push({
                    pathname: '/plan-detail',
                    params: { planId }
                });
            } catch (error) {
                console.error('Failed to create travel plan:', error);
                alert('여행 계획 생성 중 오류가 발생했습니다.');
            }
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    };

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* 제목 */}
            <Text style={styles.title}>플랜 날짜 선택</Text>

            {/* 캘린더 */}
            <Calendar
                current={new Date().toISOString().split('T')[0]}
                minDate={new Date().toISOString().split('T')[0]}
                onDayPress={handleDayPress}
                markedDates={getMarkedDates()}
                markingType="period"
                theme={{
                    backgroundColor: '#fff',
                    calendarBackground: '#fff',
                    textSectionTitleColor: '#9E9E9E',
                    selectedDayBackgroundColor: '#C8F0ED',
                    selectedDayTextColor: '#000',
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
            {startDate && endDate && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                        <Text style={styles.confirmButtonText}>
                            {formatDate(startDate)} ~ {formatDate(endDate)} 일정으로 등록
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
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        paddingHorizontal: 16,
        marginBottom: 24,
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
