import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, Pressable, TextInput, Alert as RNAlert } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

const SUPPLIES_STORAGE_KEY = 'supplies_items_';
const CHECKLIST_STORAGE_KEY = 'checklist_items_';

const DEFAULT_SUPPLIES: ChecklistItem[] = [
    { id: '1', text: '여권 및 여권 사본', checked: false },
    { id: '2', text: '현금 및 해외 결제 카드', checked: false },
    { id: '3', text: '충전기', checked: false },
    { id: '4', text: '멀티 어댑터(돼지코)', checked: false },
    { id: '5', text: '상비약', checked: false },
    { id: '6', text: '칫솔, 치약', checked: false },
];

const DEFAULT_CHECKLIST: ChecklistItem[] = [
    { id: '1', text: '여권 만료일 확인하기', checked: false },
    { id: '2', text: '여행자 보험 가입하기', checked: false },
    { id: '3', text: '수하물 무게 확인하기', checked: false },
    { id: '4', text: '액체 100ml 규정 확인하기', checked: false },
];

export default function ChecklistScreen() {
    const params = useLocalSearchParams();
    const planId = params.planId as string;

    const [selectedTab, setSelectedTab] = useState<'준비물' | '체크리스트'>('준비물');
    const [supplies, setSupplies] = useState<ChecklistItem[]>([]);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; text: string } | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newItemText, setNewItemText] = useState('');

    // 현재 탭에 따라 표시할 items
    const currentItems = selectedTab === '준비물' ? supplies : checklist;
    const setCurrentItems = selectedTab === '준비물' ? setSupplies : setChecklist;

    // 데이터 로드
    useEffect(() => {
        loadItems();
    }, [planId]);

    // 준비물 변경 시 저장
    useEffect(() => {
        if (supplies.length > 0) {
            saveSupplies();
        }
    }, [supplies]);

    // 체크리스트 변경 시 저장
    useEffect(() => {
        if (checklist.length > 0) {
            saveChecklist();
        }
    }, [checklist]);

    const loadItems = async () => {
        try {
            // 준비물 로드
            const storedSupplies = await AsyncStorage.getItem(SUPPLIES_STORAGE_KEY + planId);
            if (storedSupplies) {
                setSupplies(JSON.parse(storedSupplies));
            } else {
                setSupplies(DEFAULT_SUPPLIES);
            }

            // 체크리스트 로드
            const storedChecklist = await AsyncStorage.getItem(CHECKLIST_STORAGE_KEY + planId);
            if (storedChecklist) {
                setChecklist(JSON.parse(storedChecklist));
            } else {
                setChecklist(DEFAULT_CHECKLIST);
            }
        } catch (error) {
            console.error('Failed to load items:', error);
            setSupplies(DEFAULT_SUPPLIES);
            setChecklist(DEFAULT_CHECKLIST);
        }
    };

    const saveSupplies = async () => {
        try {
            await AsyncStorage.setItem(SUPPLIES_STORAGE_KEY + planId, JSON.stringify(supplies));
        } catch (error) {
            console.error('Failed to save supplies:', error);
        }
    };

    const saveChecklist = async () => {
        try {
            await AsyncStorage.setItem(CHECKLIST_STORAGE_KEY + planId, JSON.stringify(checklist));
        } catch (error) {
            console.error('Failed to save checklist:', error);
        }
    };

    const handleClose = () => {
        router.back();
    };

    const toggleItem = (id: string) => {
        setCurrentItems(currentItems.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const handleDeleteItem = (id: string, text: string) => {
        setItemToDelete({ id, text });
        setDeleteModalVisible(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            setCurrentItems(currentItems.filter(item => item.id !== itemToDelete.id));
        }
        setDeleteModalVisible(false);
        setItemToDelete(null);
    };

    const cancelDelete = () => {
        setDeleteModalVisible(false);
        setItemToDelete(null);
    };

    const handleAddItem = () => {
        setAddModalVisible(true);
    };

    const confirmAddItem = () => {
        if (newItemText.trim() === '') {
            RNAlert.alert('오류', `${selectedTab} 이름을 입력해주세요.`);
            return;
        }

        const newItem: ChecklistItem = {
            id: Date.now().toString(),
            text: newItemText.trim(),
            checked: false,
        };

        setCurrentItems([...currentItems, newItem]);
        setNewItemText('');
        setAddModalVisible(false);
    };

    const cancelAddItem = () => {
        setNewItemText('');
        setAddModalVisible(false);
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

            {/* 탭 */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === '준비물' && styles.tabActive]}
                    onPress={() => setSelectedTab('준비물')}
                >
                    <Text style={[styles.tabText, selectedTab === '준비물' && styles.tabTextActive]}>
                        준비물
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === '체크리스트' && styles.tabActive]}
                    onPress={() => setSelectedTab('체크리스트')}
                >
                    <Text style={[styles.tabText, selectedTab === '체크리스트' && styles.tabTextActive]}>
                        체크리스트
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 체크리스트 내용 */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.itemsContainer}>
                    {currentItems.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                                <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkbox}>
                                    <MaterialIcons
                                        name={item.checked ? 'check-box' : 'check-box-outline-blank'}
                                        size={24}
                                        color={item.checked ? '#088CDA' : '#9E9E9E'}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.itemText}>{item.text}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.moreIconButton}
                                onPress={() => handleDeleteItem(item.id, item.text)}
                            >
                                <Feather name="more-horizontal" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* 추가 버튼 */}
                <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                    <View style={styles.iconCircle}>
                        <Feather name="plus" size={10} color="#C7C7C7" />
                    </View>
                    <Text style={styles.addButtonText}>{selectedTab} 추가</Text>
                </TouchableOpacity>

                {/* 하단 구분선 */}
                <View style={styles.divider} />
            </ScrollView>

            {/* 삭제 확인 바텀 시트 */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={cancelDelete}
            >
                <Pressable style={styles.modalOverlay} onPress={cancelDelete}>
                    <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
                        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
                            <Text style={styles.deleteButtonText}>삭제하기</Text>
                        </TouchableOpacity>
                        <View style={styles.bottomSheetDivider} />
                    </Pressable>
                </Pressable>
            </Modal>

            {/* 추가 전체 화면 모달 */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={addModalVisible}
                onRequestClose={cancelAddItem}
            >
                <View style={styles.addItemFullScreen}>
                    {/* 헤더 */}
                    <View style={styles.addItemFullScreenHeader}>
                        <TouchableOpacity onPress={cancelAddItem} style={styles.closeButton}>
                            <Feather name="x" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* 타이틀 */}
                    <Text style={styles.addItemFullScreenTitle}>{selectedTab}</Text>

                    {/* 입력 필드 */}
                    <View style={styles.addItemFullScreenInputContainer}>
                        <TextInput
                            style={styles.addItemFullScreenInput}
                            placeholder=""
                            value={newItemText}
                            onChangeText={setNewItemText}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={confirmAddItem}
                        />
                        <View style={styles.addItemFullScreenInputUnderline} />
                    </View>

                    {/* 하단 등록 버튼 */}
                    <View style={styles.addItemFullScreenBottom}>
                        <TouchableOpacity style={styles.addItemFullScreenButton} onPress={confirmAddItem}>
                            <Text style={styles.addItemFullScreenButtonText}>등록</Text>
                        </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 8,
        backgroundColor: '#fff',
    },
    closeButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    tab: {
        backgroundColor: '#C7C7C7',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: '#088CDA',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#fff',
    },
    tabTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    itemsContainer: {
        gap: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    moreIconButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
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
    addButtonText: {
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
        backgroundColor: 'rgba(255, 255, 255, 1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        width: '100%',
        height: 16,
        backgroundColor: '#F6F6F6',
        marginTop: 32,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        paddingBottom: Platform.OS === 'ios' ? 42 : 16,
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    bottomSheetDivider: {
        width: '100%',
        height: 16,
        backgroundColor: '#F6F6F6',
    },
    addItemFullScreen: {
        flex: 1,
        backgroundColor: '#fff',
    },
    addItemFullScreenHeader: {
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    addItemFullScreenTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    addItemFullScreenInputContainer: {
        paddingHorizontal: 20,
    },
    addItemFullScreenInput: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        paddingVertical: 8,
        paddingHorizontal: 0,
    },
    addItemFullScreenInputUnderline: {
        height: 2,
        backgroundColor: '#088CDA',
        marginTop: 4,
    },
    addItemFullScreenBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 42 : 16,
        backgroundColor: '#fff',
    },
    addItemFullScreenButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addItemFullScreenButtonText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.2,
        color: '#fff',
        textAlign: 'center',
    },
});

