import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUser } from '../src/context/UserContext';

export default function AddAccommodationScreen() {
    const { planId, name, address, latitude, longitude, checkInDate, checkOutDate } = useLocalSearchParams<{
        planId: string;
        name?: string;
        address?: string;
        latitude?: string;
        longitude?: string;
        checkInDate?: string;
        checkOutDate?: string;
    }>();
    const { addAccommodation } = useUser();

    const [formData, setFormData] = useState({
        name: name || '',
        address: address || '',
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        checkInDate: checkInDate || '',
        checkOutDate: checkOutDate || '',
    });

    const handleBack = () => {
        router.back();
    };

    const updateFormData = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleDateSelect = () => {
        // 날짜 선택 화면으로 이동
        router.push({
            pathname: '/accommodation-date-selection',
            params: {
                planId,
                name: formData.name,
                address: formData.address,
                latitude: formData.latitude?.toString(),
                longitude: formData.longitude?.toString(),
            },
        });
    };

    const formatDateRange = (checkIn: string, checkOut: string): string => {
        if (!checkIn || !checkOut) return '';
        return `${checkIn.replace(/-/g, '.')} - ${checkOut.replace(/-/g, '.')}`;
    };

    const handleRegister = () => {
        // 유효성 검사
        if (!formData.name.trim()) {
            Alert.alert('알림', '숙소 이름을 입력해주세요.');
            return;
        }
        if (!formData.address.trim()) {
            Alert.alert('알림', '주소를 입력해주세요.');
            return;
        }
        if (!formData.checkInDate || !formData.checkOutDate) {
            Alert.alert('알림', '체크인/체크아웃 날짜를 선택해주세요.');
            return;
        }

        if (!planId) {
            Alert.alert('오류', '여행 계획 정보를 찾을 수 없습니다.');
            return;
        }

        // 숙소 추가
        addAccommodation({
            travelPlanId: planId,
            name: formData.name,
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude,
            checkInDate: formData.checkInDate,
            checkOutDate: formData.checkOutDate,
            likes: 0,
        });

        Alert.alert('등록 완료', '숙소가 등록되었습니다.', [
            {
                text: '확인',
                onPress: () => {
                    // 숙소 목록으로 돌아가기
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
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 숙소 이름 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>숙소 이름*</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="호텔 케이한 난바 그란데"
                            placeholderTextColor="#B0B0B0"
                            value={formData.name}
                            onChangeText={(value) => updateFormData('name', value)}
                            multiline={false}
                            numberOfLines={1}
                            scrollEnabled={false}
                        />
                        <View style={styles.underline} />
                    </View>
                </View>

                {/* 주소 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>주소*</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Hotel Keihan Namba Grande, 2 Chome..."
                            placeholderTextColor="#B0B0B0"
                            value={formData.address}
                            onChangeText={(value) => updateFormData('address', value)}
                            multiline={false}
                            numberOfLines={1}
                            scrollEnabled={false}
                        />
                        <View style={styles.underline} />
                    </View>
                </View>

                {/* 날짜 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>날짜*</Text>
                    {formData.checkInDate && formData.checkOutDate ? (
                        <TouchableOpacity style={styles.inputContainer} onPress={handleDateSelect}>
                            <Text style={styles.input}>
                                {formatDateRange(formData.checkInDate, formData.checkOutDate)}
                            </Text>
                            <View style={styles.underline} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.dateButton} onPress={handleDateSelect}>
                            <View style={styles.dateButtonContent}>
                                <Feather name="calendar" size={12} color="#000" />
                                <Text style={styles.dateButtonText}>날짜 선택</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* 하단바 */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.registerButton,
                        (!formData.name || !formData.address || !formData.checkInDate || !formData.checkOutDate) &&
                            styles.registerButtonDisabled,
                    ]}
                    onPress={handleRegister}
                    disabled={!formData.name || !formData.address || !formData.checkInDate || !formData.checkOutDate}
                >
                    <Text style={styles.registerButtonText}>등록</Text>
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
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
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
        width: '100%',
    },
    input: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        paddingBottom: 4,
        paddingHorizontal: 0,
        paddingVertical: 0,
        height: 24,
    },
    underline: {
        height: 1,
        backgroundColor: '#088CDA',
        marginTop: 4,
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
});

