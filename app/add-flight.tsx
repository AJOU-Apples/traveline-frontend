import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert} from 'react-native';
import {Text} from 'react-native-paper';
import {router, useLocalSearchParams} from 'expo-router';
import {Feather} from '@expo/vector-icons';
import {useUser} from '../src/context/UserContext';
import TimePicker from '../components/TimePicker';

export default function AddFlightScreen() {
    const {
        planId,
        departureDate,
        airline,
        flightNumber,
        departureAirport,
        departureAirportCode,
        arrivalAirport,
        arrivalAirportCode,
    } = useLocalSearchParams<{
        planId: string;
        departureDate?: string;
        airline?: string;
        flightNumber?: string;
        departureAirport?: string;
        departureAirportCode?: string;
        arrivalAirport?: string;
        arrivalAirportCode?: string;
    }>();
    const {addFlight} = useUser();

    const [formData, setFormData] = useState({
        departureDate: departureDate || '',
        airline: airline || '',
        flightNumber: flightNumber || '',
        departureAirport: departureAirport || '',
        departureAirportCode: departureAirportCode || '',
        arrivalAirport: arrivalAirport || '',
        arrivalAirportCode: arrivalAirportCode || '',
        departureTime: '',
        arrivalTime: '',
    });

    const handleBack = () => {
        router.back();
    };

    const updateFormData = (key: string, value: string) => {
        setFormData((prev) => ({...prev, [key]: value}));
    };

    const calculateDuration = (departure: string, arrival: string): string => {
        if (!departure || !arrival) return '';

        const [depHour, depMin] = departure.split(':').map(Number);
        const [arrHour, arrMin] = arrival.split(':').map(Number);

        const depMinutes = depHour * 60 + depMin;
        const arrMinutes = arrHour * 60 + arrMin;

        let diff = arrMinutes - depMinutes;
        if (diff < 0) diff += 24 * 60; // 다음날 도착

        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;

        return `${hours}시간 ${minutes}분`;
    };

    const handleAdd = () => {
        // 유효성 검사
        if (!formData.departureDate || !formData.airline || !formData.flightNumber) {
            Alert.alert('알림', '항공편명 정보를 입력해주세요.');
            return;
        }
        if (!formData.departureAirport) {
            Alert.alert('알림', '출발 공항을 입력해주세요.');
            return;
        }
        if (!formData.arrivalAirport) {
            Alert.alert('알림', '도착 공항을 입력해주세요.');
            return;
        }
        if (!formData.departureTime) {
            Alert.alert('알림', '출발 시간을 입력해주세요.');
            return;
        }
        if (!formData.arrivalTime) {
            Alert.alert('알림', '도착 시간을 입력해주세요.');
            return;
        }

        if (!planId) {
            Alert.alert('오류', '여행 계획 정보를 찾을 수 없습니다.');
            return;
        }

        // 항공편 추가
        const duration = calculateDuration(formData.departureTime, formData.arrivalTime);
        addFlight({
            travelPlanId: planId,
            airline: formData.airline,
            flightNumber: formData.flightNumber,
            departureDate: formData.departureDate,
            departureTime: formData.departureTime,
            arrivalTime: formData.arrivalTime,
            departureAirport: formData.departureAirport,
            departureAirportCode: formData.departureAirportCode || '',
            arrivalAirport: formData.arrivalAirport,
            arrivalAirportCode: formData.arrivalAirportCode || '',
            duration: duration || undefined,
            likes: 0,
        });

        Alert.alert('추가 완료', '항공편이 추가되었습니다.', [
            {
                text: '확인',
                onPress: () => {
                    // 항공편 목록으로 돌아가기
                    router.back();
                    router.back();
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>항공편 추가</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 출발일 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>출발일</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.input}>
                            {formData.departureDate ? formData.departureDate.replace(/-/g, '.') : ''}
                        </Text>
                        <View style={styles.underline}/>
                    </View>
                </View>

                {/* 항공편명 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>항공편명</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.input}>
                            {formData.airline}{formData.flightNumber}
                        </Text>
                        <View style={styles.underline}/>
                    </View>
                </View>

                {/* 출발 공항 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>출발 공항</Text>
                    <TouchableOpacity
                        style={styles.inputContainer}
                        onPress={() => {
                            router.push({
                                pathname: '/search-airport',
                                params: {
                                    planId,
                                    type: 'departure',
                                    currentDate: formData.departureDate,
                                    currentAirline: formData.airline,
                                    currentFlightNumber: formData.flightNumber,
                                    // 현재 공항 정보 전달
                                    departureAirport: formData.departureAirport,
                                    departureAirportCode: formData.departureAirportCode,
                                    arrivalAirport: formData.arrivalAirport,
                                    arrivalAirportCode: formData.arrivalAirportCode,
                                },
                            });
                        }}
                    >
                        <Text style={[styles.input, !formData.departureAirport && styles.placeholder]}>
                            {formData.departureAirport
                                ? formData.departureAirportCode
                                    ? `${formData.departureAirport} (${formData.departureAirportCode})`
                                    : formData.departureAirport
                                : '공항을 검색해주세요'}
                        </Text>
                        <View style={styles.underline}/>
                    </TouchableOpacity>
                </View>

                {/* 도착 공항 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>도착 공항</Text>
                    <TouchableOpacity
                        style={styles.inputContainer}
                        onPress={() => {
                            router.push({
                                pathname: '/search-airport',
                                params: {
                                    planId,
                                    type: 'arrival',
                                    currentDate: formData.departureDate,
                                    currentAirline: formData.airline,
                                    currentFlightNumber: formData.flightNumber,
                                    // 현재 공항 정보 전달
                                    departureAirport: formData.departureAirport,
                                    departureAirportCode: formData.departureAirportCode,
                                    arrivalAirport: formData.arrivalAirport,
                                    arrivalAirportCode: formData.arrivalAirportCode,
                                },
                            });
                        }}
                    >
                        <Text style={[styles.input, !formData.arrivalAirport && styles.placeholder]}>
                            {formData.arrivalAirport
                                ? formData.arrivalAirportCode
                                    ? `${formData.arrivalAirport} (${formData.arrivalAirportCode})`
                                    : formData.arrivalAirport
                                : '공항을 검색해주세요'}
                        </Text>
                        <View style={styles.underline}/>
                    </TouchableOpacity>
                </View>

                {/* 출발 시간 */}
                <TimePicker
                    label="출발 시간"
                    value={formData.departureTime}
                    placeholder="출발 시간을 입력해주세요."
                    onChange={(time) => updateFormData('departureTime', time)}
                />

                {/* 도착 시간 */}
                <TimePicker
                    label="도착 시간"
                    value={formData.arrivalTime}
                    placeholder="도착 시간을 입력해주세요."
                    onChange={(time) => updateFormData('arrivalTime', time)}
                />
            </ScrollView>

            {/* 하단바 */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.addButton,
                        (!formData.departureDate ||
                            !formData.airline ||
                            !formData.flightNumber ||
                            !formData.departureAirport ||
                            !formData.arrivalAirport ||
                            !formData.departureTime ||
                            !formData.arrivalTime) &&
                        styles.addButtonDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={
                        !formData.departureDate ||
                        !formData.airline ||
                        !formData.flightNumber ||
                        !formData.departureAirport ||
                        !formData.arrivalAirport ||
                        !formData.departureTime ||
                        !formData.arrivalTime
                    }
                >
                    <Text style={styles.addButtonText}>추가</Text>
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
    addButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    addButtonDisabled: {
        backgroundColor: '#B0B0B0',
    },
    addButtonText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
        fontWeight: '600',
    },
    placeholder: {
        color: '#B0B0B0',
    },
});

