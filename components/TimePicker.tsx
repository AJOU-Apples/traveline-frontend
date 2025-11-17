import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

type TimePickerProps = {
    label: string;
    value?: string; // HH:MM format
    placeholder?: string;
    onChange: (time: string) => void;
};

export default function TimePicker({ label, value, placeholder, onChange }: TimePickerProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState(() => {
        if (value) {
            const [hours, minutes] = value.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        }
        return new Date();
    });

    const handleTimeChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (date) {
            setSelectedTime(date);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            onChange(`${hours}:${minutes}`);
        }
    };

    const handleConfirm = () => {
        const hours = selectedTime.getHours().toString().padStart(2, '0');
        const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
        onChange(`${hours}:${minutes}`);
        setShowPicker(false);
    };

    const handleCancel = () => {
        setShowPicker(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowPicker(true)}>
                <Text style={[styles.input, !value && styles.placeholder]}>
                    {value || placeholder || '시간을 입력해주세요.'}
                </Text>
                <View style={styles.underline} />
            </TouchableOpacity>

            {/* iOS 모달 */}
            {Platform.OS === 'ios' && (
                <Modal visible={showPicker} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerContainer}>
                            <View style={styles.pickerHeader}>
                                <TouchableOpacity onPress={handleCancel}>
                                    <Text style={styles.cancelButton}>취소하기</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleConfirm}>
                                    <Text style={styles.confirmButton}>확인</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={selectedTime}
                                mode="time"
                                display="spinner"
                                onChange={handleTimeChange}
                                locale="ko-KR"
                                style={styles.picker}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {/* Android 네이티브 피커 */}
            {Platform.OS === 'android' && showPicker && (
                <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                    locale="ko-KR"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
    },
    placeholder: {
        color: '#B0B0B0',
    },
    underline: {
        height: 1,
        backgroundColor: '#088CDA',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ECECEC',
    },
    cancelButton: {
        fontSize: 16,
        color: '#585858',
    },
    confirmButton: {
        fontSize: 16,
        color: '#088CDA',
        fontWeight: '600',
    },
    picker: {
        backgroundColor: '#fff',
    },
});

