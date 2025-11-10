import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUser } from '../src/context/UserContext';
import FlightCard from '../components/FlightCard';

export default function FlightsScreen() {
    const { planId } = useLocalSearchParams<{ planId: string }>();
    const { getFlightsByPlan, deleteFlight, toggleFlightSelection } = useUser();
    const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);

    const flights = planId ? getFlightsByPlan(planId) : [];

    const handleBack = () => {
        router.back();
    };

    const handleAddFlight = () => {
        router.push({
            pathname: '/register-flight-number',
            params: { planId },
        });
    };

    const handleMorePress = (flightId: string) => {
        setSelectedFlightId(flightId);
        setShowActionModal(true);
    };

    const handleToggleSelection = () => {
        if (selectedFlightId) {
            toggleFlightSelection(selectedFlightId);
            setShowActionModal(false);
            setSelectedFlightId(null);
        }
    };

    const handleDelete = () => {
        if (selectedFlightId) {
            setShowActionModal(false);
            Alert.alert('삭제 확인', '항공편을 삭제하시겠습니까?', [
                {
                    text: '취소',
                    style: 'cancel',
                    onPress: () => setSelectedFlightId(null),
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        deleteFlight(selectedFlightId);
                        setSelectedFlightId(null);
                    },
                },
            ]);
        }
    };

    const selectedFlight = flights.find((f) => f.id === selectedFlightId);
    const isFlightSelected = selectedFlight?.isSelected || false;

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>항공편</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 항공편 추가 버튼 */}
                <TouchableOpacity style={styles.addButton} onPress={handleAddFlight}>
                    <Feather name="plus" size={16} color="#000" />
                    <Text style={styles.addButtonText}>항공편 추가</Text>
                </TouchableOpacity>

                {/* 항공편 목록 */}
                {flights.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>등록된 항공편이 없습니다.</Text>
                        <Text style={styles.emptySubText}>항공편을 추가해주세요.</Text>
                    </View>
                ) : (
                    <View style={styles.flightsList}>
                        {flights.map((flight) => (
                            <FlightCard
                                key={flight.id}
                                flight={flight}
                                onMorePress={() => handleMorePress(flight.id)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* 액션 모달 */}
            <Modal visible={showActionModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowActionModal(false)}
                >
                    <View style={styles.bottomSheet}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleToggleSelection}>
                            <Text style={styles.actionButtonText}>
                                {isFlightSelected ? '선택 해제하기' : '선택하기'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Text style={styles.deleteButtonText}>삭제하기</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-end',
        backgroundColor: '#ECECEC',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 24,
        marginTop: 16,
        marginBottom: 32,
    },
    addButtonText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#000',
    },
    flightsList: {
        paddingBottom: 32,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#585858',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.15,
        color: '#B0B0B0',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    actionButton: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ECECEC',
    },
    actionButtonText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#088CDA',
    },
    deleteButton: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    deleteButtonText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#FF3B30',
    },
});

