import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, Pressable, TextInput, Alert as RNAlert, RefreshControl } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser, type Supply, type Task } from '../src/context/UserContext';

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export default function ChecklistScreen() {
    const params = useLocalSearchParams();
    const planId = params.planId as string;
    const insets = useSafeAreaInsets();

    const { getSuppliesByPlan, createSupply, updateSupply, deleteSupply, getTasksByPlan, createTask, updateTask, deleteTask } = useUser();

    const [selectedTab, setSelectedTab] = useState<'준비물' | '체크리스트'>('준비물');
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; text: string } | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newItemText, setNewItemText] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 현재 탭에 따라 표시할 items
    const currentItems: ChecklistItem[] = selectedTab === '준비물'
        ? supplies.map(s => ({ id: s.id, text: s.text, checked: s.checked }))
        : tasks.map(t => ({ id: t.id, text: t.text, checked: t.checked }));

    // 데이터 로드
    const loadItems = useCallback(async () => {
        if (!planId) return;

        try {
            const [fetchedSupplies, fetchedTasks] = await Promise.all([
                getSuppliesByPlan(planId),
                getTasksByPlan(planId),
            ]);
            setSupplies(fetchedSupplies);
            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Failed to load items:', error);
            RNAlert.alert('오류', '데이터를 불러오지 못했습니다.');
        }
    }, [planId, getSuppliesByPlan, getTasksByPlan]);

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [loadItems])
    );

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadItems();
        setIsRefreshing(false);
    };

    const handleClose = () => {
        router.back();
    };

    const handlePlanDetailPress = () => {
        router.push({
            pathname: '/plan-detail',
            params: { planId: planId || '' }
        });
    };

    const handleExpensesPress = () => {
        router.push({
            pathname: '/expenses',
            params: { planId: planId || '' }
        });
    };

    const toggleItem = async (id: string) => {
        try {
            if (selectedTab === '준비물') {
                const supply = supplies.find(s => s.id === id);
                if (supply) {
                    await updateSupply(id, { checked: !supply.checked });
                    setSupplies(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
                }
            } else {
                const task = tasks.find(t => t.id === id);
                if (task) {
                    await updateTask(id, { checked: !task.checked });
                    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
                }
            }
        } catch (error) {
            console.error('Failed to toggle item:', error);
            RNAlert.alert('오류', '체크 상태 변경에 실패했습니다.');
        }
    };

    const handleDeleteItem = (id: string, text: string) => {
        setItemToDelete({ id, text });
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (selectedTab === '준비물') {
                await deleteSupply(itemToDelete.id);
                setSupplies(prev => prev.filter(s => s.id !== itemToDelete.id));
            } else {
                await deleteTask(itemToDelete.id);
                setTasks(prev => prev.filter(t => t.id !== itemToDelete.id));
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
            RNAlert.alert('오류', '삭제에 실패했습니다.');
        } finally {
            setDeleteModalVisible(false);
            setItemToDelete(null);
        }
    };

    const cancelDelete = () => {
        setDeleteModalVisible(false);
        setItemToDelete(null);
    };

    const handleAddItem = () => {
        setAddModalVisible(true);
    };

    const confirmAddItem = async () => {
        if (newItemText.trim() === '') {
            RNAlert.alert('오류', `${selectedTab} 이름을 입력해주세요.`);
            return;
        }

        try {
            if (selectedTab === '준비물') {
                const newSupply = await createSupply(planId, {
                    text: newItemText.trim(),
                    checked: false,
                    orderIndex: supplies.length,
                });
                setSupplies(prev => [...prev, newSupply]);
            } else {
                const newTask = await createTask(planId, {
                    text: newItemText.trim(),
                    checked: false,
                    orderIndex: tasks.length,
                });
                setTasks(prev => [...prev, newTask]);
            }
            setNewItemText('');
            setAddModalVisible(false);
        } catch (error) {
            console.error('Failed to add item:', error);
            RNAlert.alert('오류', '추가에 실패했습니다.');
        }
    };

    const cancelAddItem = () => {
        setNewItemText('');
        setAddModalVisible(false);
    };

    return (
        <View style={styles.container}>
            {/* 상단 헤더 */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
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
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
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
        color: '#fff',
    },
    tabTextActive: {
        fontWeight: '400',
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    itemsContainer: {
        paddingTop: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        marginRight: 12,
    },
    itemText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: '#000',
    },
    moreIconButton: {
        padding: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    iconCircle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#C7C7C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addButtonText: {
        fontSize: 16,
        color: '#9E9E9E',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginTop: 16,
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
        paddingTop: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    deleteButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
        color: '#FF3B30',
        fontWeight: '500',
    },
    bottomSheetDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginTop: 8,
    },
    addItemFullScreen: {
        flex: 1,
        backgroundColor: '#fff',
    },
    addItemFullScreenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 16,
    },
    addItemFullScreenTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    addItemFullScreenInputContainer: {
        paddingHorizontal: 20,
    },
    addItemFullScreenInput: {
        fontSize: 16,
        color: '#000',
        paddingVertical: 12,
    },
    addItemFullScreenInputUnderline: {
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    addItemFullScreenBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    addItemFullScreenButton: {
        backgroundColor: '#088CDA',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    addItemFullScreenButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
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
});
