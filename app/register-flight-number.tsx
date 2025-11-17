import React, {useMemo, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert, Modal, ActivityIndicator} from 'react-native';
import {Text} from 'react-native-paper';
import {router, useLocalSearchParams} from 'expo-router';
import {Feather} from '@expo/vector-icons';
import {Calendar, DateData} from 'react-native-calendars';
import {getFlightStatus} from '../src/utils/amadeusApi';
import {useUser} from '../src/context/UserContext';

export default function RegisterFlightNumberScreen() {
    const {planId} = useLocalSearchParams<{ planId: string }>();
    const {getTravelPlan} = useUser();
    const travelPlan = planId ? getTravelPlan(planId) : undefined;
    const [departureDate, setDepartureDate] = useState('');
    const [airline, setAirline] = useState('');
    const [flightNumber, setFlightNumber] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const {minSelectableDate, maxSelectableDate} = useMemo(() => {
        if (!travelPlan?.days?.length) {
            return {minSelectableDate: undefined, maxSelectableDate: undefined};
        }

        const sortedDays = [...travelPlan.days].sort((a, b) => a.dayNumber - b.dayNumber);
        return {
            minSelectableDate: sortedDays[0]?.date,
            maxSelectableDate: sortedDays[sortedDays.length - 1]?.date,
        };
    }, [travelPlan]);
    const calendarInitialDate = useMemo(
        () => departureDate || minSelectableDate || new Date().toISOString().split('T')[0],
        [departureDate, minSelectableDate],
    );

    const handleBack = () => {
        router.back();
    };

    const handleDateSelect = () => {
        if (!minSelectableDate || !maxSelectableDate) {
            Alert.alert('알림', '여행 기간 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        setShowDatePicker(true);
    };

    const handleDayPress = (day: DateData) => {
        if (
            (minSelectableDate && day.dateString < minSelectableDate) ||
            (maxSelectableDate && day.dateString > maxSelectableDate)
        ) {
            return;
        }
        setDepartureDate(day.dateString);
        setShowDatePicker(false);
    };

    const handleRegister = async () => {
        // 유효성 검사
        if (!departureDate) {
            Alert.alert('알림', '출발일을 선택해주세요.');
            return;
        }
        if (!airline.trim()) {
            Alert.alert('알림', '항공사 코드를 입력해주세요.');
            return;
        }
        if (!flightNumber.trim()) {
            Alert.alert('알림', '편명을 입력해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            // Amadeus API를 통해 항공편 정보 조회
            const flightInfo = await getFlightStatus(
                airline.toUpperCase(),
                flightNumber,
                departureDate
            );

            setIsLoading(false);

            if (flightInfo) {
                // API에서 정보를 가져온 경우, 자동으로 채워진 정보와 함께 이동
                router.push({
                    pathname: '/add-flight',
                    params: {
                        planId,
                        departureDate,
                        airline: airline.toUpperCase(),
                        flightNumber,
                        departureAirport: flightInfo.departureAirport,
                        departureAirportCode: flightInfo.departureAirportCode,
                        arrivalAirport: flightInfo.arrivalAirport,
                        arrivalAirportCode: flightInfo.arrivalAirportCode,
                        departureTime: flightInfo.departureTime,
                        arrivalTime: flightInfo.arrivalTime,
                    },
                });
            } else {
                // API에서 정보를 가져오지 못한 경우, 수동 입력
                Alert.alert(
                    '항공편 정보 없음',
                    '항공편 정보를 찾을 수 없습니다. 수동으로 입력해주세요.',
                    [
                        {
                            text: '확인',
                            onPress: () => {
                                router.push({
                                    pathname: '/add-flight',
                                    params: {
                                        planId,
                                        departureDate,
                                        airline: airline.toUpperCase(),
                                        flightNumber,
                                    },
                                });
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            setIsLoading(false);
            console.error('Error fetching flight info:', error);
            Alert.alert(
                '오류',
                '항공편 정보를 불러오는 중 오류가 발생했습니다. 수동으로 입력해주세요.',
                [
                    {
                        text: '확인',
                        onPress: () => {
                            router.push({
                                pathname: '/add-flight',
                                params: {
                                    planId,
                                    departureDate,
                                    airline: airline.toUpperCase(),
                                    flightNumber,
                                },
                            });
                        },
                    },
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>항공편명 등록</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 출발일 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>출발일</Text>
                    {departureDate ? (
                        <View style={styles.inputContainer}>
                            <Text style={styles.input}>{departureDate.replace(/-/g, '.')}</Text>
                            <View style={styles.underline}/>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.dateButton} onPress={handleDateSelect}>
                            <View style={styles.dateButtonContent}>
                                <Feather name="calendar" size={12} color="#000"/>
                                <Text style={styles.dateButtonText}>날짜 선택</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 항공사 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>항공사</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="항공사 코드를 입력해주세요."
                            placeholderTextColor="#B0B0B0"
                            value={airline}
                            onChangeText={(text) => setAirline(text.toUpperCase())}
                            autoCapitalize="characters"
                            maxLength={3}
                        />
                        <View style={styles.underline}/>
                    </View>
                </View>

                {/* 편명 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>편명</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="편명을 입력해주세요. 예) 101"
                            placeholderTextColor="#B0B0B0"
                            value={flightNumber}
                            onChangeText={(text) => setFlightNumber(text.toUpperCase())}
                            autoCapitalize="characters"
                        />
                        <View style={styles.underline}/>
                    </View>
                </View>
            </ScrollView>

            {/* 하단바 */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.registerButton, (!departureDate || !airline || !flightNumber || isLoading) && styles.registerButtonDisabled]}
                    onPress={handleRegister}
                    disabled={!departureDate || !airline || !flightNumber || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.registerButtonText}>등록</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* 날짜 선택 모달 */}
            <Modal visible={showDatePicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>출발일 선택</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Feather name="x" size={24} color="#000"/>
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            current={calendarInitialDate}
                            minDate={minSelectableDate}
                            maxDate={maxSelectableDate}
                            disableAllTouchEventsForDisabledDays
                            onDayPress={handleDayPress}
                            markedDates={
                                departureDate
                                    ? {
                                        [departureDate]: {
                                            selected: true,
                                            selectedColor: '#088CDA',
                                        },
                                    }
                                    : {}
                            }
                            theme={{
                                selectedDayBackgroundColor: '#088CDA',
                                selectedDayTextColor: '#fff',
                                todayTextColor: '#088CDA',
                                dayTextColor: '#000',
                                textDisabledColor: '#d9e1e8',
                                monthTextColor: '#000',
                                textMonthFontWeight: '600',
                                textDayFontSize: 14,
                                textMonthFontSize: 16,
                            }}
                        />
                    </View>
                </View>
            </Modal>
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 8,
        paddingHorizontal: 16,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: Platform.OS === 'ios' ? 56 : 24,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        fontWeight: '600',
        color: '#000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        fontWeight: '400',
        color: '#000',
        marginBottom: 16,
    },
    dateButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#ECECEC',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 24,
    },
    dateButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateButtonText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        paddingBottom: 4,
        paddingHorizontal: 0,
    },
    underline: {
        height: 1,
        backgroundColor: '#088CDA',
        marginTop: 4,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    registerButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    registerButtonDisabled: {
        backgroundColor: '#B0B0B0',
    },
    registerButtonText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
});

