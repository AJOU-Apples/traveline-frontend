import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, Alert} from 'react-native';
import {Text} from 'react-native-paper';
import {router, useLocalSearchParams} from 'expo-router';
import {Feather} from '@expo/vector-icons';
import {useUser} from '../src/context/UserContext';
import AccommodationCard from '../components/AccommodationCard';

export default function AccommodationsScreen() {
    const {planId} = useLocalSearchParams<{ planId: string }>();
    const {getAccommodationsByPlan, deleteAccommodation, toggleAccommodationSelection} = useUser();
    const [selectedAccommodationId, setSelectedAccommodationId] = useState<string | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);

    const accommodations = planId ? getAccommodationsByPlan(planId) : [];

    const handleBack = () => {
        router.back();
    };

    const handleAddAccommodation = () => {
        router.push({
            pathname: '/search-accommodation',
            params: {planId},
        });
    };

    const handleMorePress = (accommodationId: string) => {
        setSelectedAccommodationId(accommodationId);
        setShowActionModal(true);
    };

    const handleToggleSelection = () => {
        if (selectedAccommodationId) {
            toggleAccommodationSelection(selectedAccommodationId);
            setShowActionModal(false);
            setSelectedAccommodationId(null);
        }
    };

    const handleDelete = () => {
        if (selectedAccommodationId) {
            setShowActionModal(false);
            Alert.alert('삭제 확인', '숙소를 삭제하시겠습니까?', [
                {
                    text: '취소',
                    style: 'cancel',
                    onPress: () => setSelectedAccommodationId(null),
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        deleteAccommodation(selectedAccommodationId);
                        setSelectedAccommodationId(null);
                    },
                },
            ]);
        }
    };

    const selectedAccommodation = accommodations.find((a) => a.id === selectedAccommodationId);
    const isAccommodationSelected = selectedAccommodation?.isSelected || false;

    return (
        <View style={styles.container}>
            {/* 상단바 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>숙소</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 숙소 추가 버튼 */}
                <TouchableOpacity style={styles.addButton} onPress={handleAddAccommodation}>
                    <Feather name="plus" size={16} color="#000"/>
                    <Text style={styles.addButtonText}>숙소 추가</Text>
                </TouchableOpacity>

                {/* 숙소 목록 */}
                {accommodations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>등록된 숙소가 없습니다.</Text>
                        <Text style={styles.emptySubText}>숙소를 추가해주세요.</Text>
                    </View>
                ) : (
                    <View style={styles.accommodationsList}>
                        {accommodations.map((accommodation) => (
                            <AccommodationCard
                                key={accommodation.id}
                                accommodation={accommodation}
                                onMorePress={() => handleMorePress(accommodation.id)}
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
                                {isAccommodationSelected ? '선택 해제하기' : '선택하기'}
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
    accommodationsList: {
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

