import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, RefreshControl, Animated, PanResponder, Dimensions } from 'react-native';
import type { PanResponderGestureState } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUser, type Expense } from '../src/context/UserContext';

type DayExpenses = {
    dayNumber: number;
    date: string;
    expenses: Expense[];
};

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SETTLEMENT_COLLAPSED_HEIGHT = 220;
const SETTLEMENT_EXPANDED_HEIGHT = Math.min(WINDOW_HEIGHT * 0.7, 480);

const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

export default function ExpensesScreen() {
    const params = useLocalSearchParams();
    const planId = params.planId as string;

    const { authUser, getTravelPlan, getExpensesByPlan } = useUser();

    const [selectedTab, setSelectedTab] = useState<'가계부' | '정산표'>('가계부');
    const [selectedFilter, setSelectedFilter] = useState<'전체' | '1일차' | '2일차' | '3일차'>('전체');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState({ totalAmount: 0, totalPersonal: 0, totalShared: 0, expenseCount: 0 });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const travelPlan = getTravelPlan(planId);

    const sheetHeight = useRef(new Animated.Value(SETTLEMENT_COLLAPSED_HEIGHT)).current;
    const sheetHeightValue = useRef(SETTLEMENT_COLLAPSED_HEIGHT);
    const dragStartHeight = useRef(SETTLEMENT_COLLAPSED_HEIGHT);

    const animateSheetTo = useCallback((targetHeight: number) => {
        sheetHeightValue.current = targetHeight;
        Animated.spring(sheetHeight, {
            toValue: targetHeight,
            useNativeDriver: false,
            tension: 160,
            friction: 22,
        }).start();
    }, [sheetHeight]);

    const handleSheetRelease = useCallback((gestureState: PanResponderGestureState) => {
        const nextHeight = clamp(
            dragStartHeight.current - gestureState.dy,
            SETTLEMENT_COLLAPSED_HEIGHT,
            SETTLEMENT_EXPANDED_HEIGHT,
        );
        const threshold = (SETTLEMENT_COLLAPSED_HEIGHT + SETTLEMENT_EXPANDED_HEIGHT) / 2;
        const finalHeight = nextHeight > threshold ? SETTLEMENT_EXPANDED_HEIGHT : SETTLEMENT_COLLAPSED_HEIGHT;
        animateSheetTo(finalHeight);
    }, [animateSheetTo]);

    const panResponder = React.useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
        onPanResponderGrant: () => {
            dragStartHeight.current = sheetHeightValue.current;
        },
        onPanResponderMove: (_, gestureState) => {
            const nextHeight = clamp(
                dragStartHeight.current - gestureState.dy,
                SETTLEMENT_COLLAPSED_HEIGHT,
                SETTLEMENT_EXPANDED_HEIGHT,
            );
            sheetHeight.setValue(nextHeight);
            sheetHeightValue.current = nextHeight;
        },
        onPanResponderRelease: (_, gestureState) => {
            handleSheetRelease(gestureState);
        },
        onPanResponderTerminate: (_, gestureState) => {
            handleSheetRelease(gestureState);
        },
    }), [handleSheetRelease, sheetHeight]);

    React.useEffect(() => {
        if (selectedTab === '정산표') {
            animateSheetTo(SETTLEMENT_COLLAPSED_HEIGHT);
        }
    }, [selectedTab, animateSheetTo]);

    // 자신의 총 지출 금액 계산 (개인 지출 + 공용 지출)
    const myTotalExpensesByCurrency = React.useMemo(() => {
        if (!authUser) return {};

        const totalsByCurrency: { [currency: string]: number } = {};

        expenses.forEach(expense => {
            // 자신의 개인 지출 또는 모든 공용 지출
            if (expense.type === 'PERSONAL' && expense.paidById === authUser.id.toString()) {
                // 자신의 개인 지출
                totalsByCurrency[expense.currency] = (totalsByCurrency[expense.currency] || 0) + expense.amount;
            } else if (expense.type === 'SHARED') {
                // 모든 공용 지출
                totalsByCurrency[expense.currency] = (totalsByCurrency[expense.currency] || 0) + expense.amount;
            }
        });

        return totalsByCurrency;
    }, [expenses, authUser]);

    const memberNameMap = React.useMemo(() => {
        const map: Record<string, string> = {};

        travelPlan?.members?.forEach((member) => {
            map[member.userId] = member.username;
        });

        if (authUser) {
            map[authUser.id.toString()] = authUser.username;
        }

        return map;
    }, [travelPlan?.members, authUser]);

    const sharedExpenses = React.useMemo(() => {
        return expenses.filter((expense) => expense.type === 'SHARED');
    }, [expenses]);

    const sharedExpenseGroups = React.useMemo(() => {
        const groups = new Map<string, {
            payerId: string;
            payerName: string;
            currency: string;
            expenses: Expense[];
            totalAmount: number;
        }>();

        sharedExpenses.forEach((expense) => {
            const currency = expense.currency || 'KRW';
            const key = `${expense.paidById}-${currency}`;
            const payerName = memberNameMap[expense.paidById] || expense.paidByName || '알 수 없음';

            if (!groups.has(key)) {
                groups.set(key, {
                    payerId: expense.paidById,
                    payerName,
                    currency,
                    expenses: [],
                    totalAmount: 0,
                });
            }

            const group = groups.get(key)!;
            group.expenses.push(expense);
            group.totalAmount += expense.amount;
        });

        return Array.from(groups.values()).map((group) => ({
            ...group,
            expenses: [...group.expenses].sort((a, b) => {
                const dateA = a.expenseDate || a.createdAt;
                const dateB = b.expenseDate || b.createdAt;
                return (dateB || '').localeCompare(dateA || '');
            }),
        })).sort((a, b) => a.payerName.localeCompare(b.payerName, 'ko'));
    }, [sharedExpenses, memberNameMap]);

    const settlementSummary = React.useMemo(() => {
        const ledgerByCurrency: Record<string, Record<string, {
            memberId: string;
            name: string;
            paid: number;
            shouldPay: number;
        }>> = {};
        const totalByCurrency: Record<string, number> = {};
        const participantsByCurrency: Record<string, Set<string>> = {};

        sharedExpenses.forEach((expense) => {
            const currency = expense.currency || 'KRW';
            const payerId = expense.paidById;
            const payerName = memberNameMap[payerId] || expense.paidByName || '알 수 없음';

            if (!ledgerByCurrency[currency]) {
                ledgerByCurrency[currency] = {};
            }
            if (!totalByCurrency[currency]) {
                totalByCurrency[currency] = 0;
            }
            if (!participantsByCurrency[currency]) {
                participantsByCurrency[currency] = new Set();
            }

            totalByCurrency[currency] += expense.amount;

            if (!ledgerByCurrency[currency][payerId]) {
                ledgerByCurrency[currency][payerId] = {
                    memberId: payerId,
                    name: payerName,
                    paid: 0,
                    shouldPay: 0,
                };
            }
            ledgerByCurrency[currency][payerId].paid += expense.amount;
            participantsByCurrency[currency].add(payerId);

            const defaultParticipants = travelPlan?.members?.map((member) => member.userId) || [];
            const splitTargets = (expense.splitWith && expense.splitWith.length > 0)
                ? expense.splitWith
                : defaultParticipants;
            const participantIds = Array.from(new Set([payerId, ...splitTargets]));

            if (participantIds.length === 0) {
                participantIds.push(payerId);
            }

            const perShare = expense.splitAmount ?? (expense.amount / participantIds.length);

            participantIds.forEach((participantId) => {
                const name = memberNameMap[participantId]
                    || travelPlan?.members?.find((member) => member.userId === participantId)?.name
                    || (participantId === payerId ? payerName : '')
                    || '알 수 없음';

                if (!ledgerByCurrency[currency][participantId]) {
                    ledgerByCurrency[currency][participantId] = {
                        memberId: participantId,
                        name,
                        paid: 0,
                        shouldPay: 0,
                    };
                } else if (!ledgerByCurrency[currency][participantId].name) {
                    ledgerByCurrency[currency][participantId].name = name;
                }

                ledgerByCurrency[currency][participantId].shouldPay += perShare;
                participantsByCurrency[currency].add(participantId);
            });
        });

        const perPersonShare: Record<string, number> = {};
        Object.entries(totalByCurrency).forEach(([currency, total]) => {
            const participantCount = participantsByCurrency[currency]?.size || 0;
            if (participantCount > 0) {
                perPersonShare[currency] = total / participantCount;
            }
        });

        const instructions: { currency: string; from: string; to: string; amount: number }[] = [];

        Object.entries(ledgerByCurrency).forEach(([currency, ledger]) => {
            const payers: { memberId: string; name: string; amount: number }[] = [];
            const receivers: { memberId: string; name: string; amount: number }[] = [];

            Object.values(ledger).forEach((entry) => {
                const net = entry.paid - entry.shouldPay;
                if (Math.abs(net) < 1e-2) {
                    return;
                }
                if (net > 0) {
                    receivers.push({
                        memberId: entry.memberId,
                        name: entry.name || memberNameMap[entry.memberId] || '알 수 없음',
                        amount: net,
                    });
                } else {
                    payers.push({
                        memberId: entry.memberId,
                        name: entry.name || memberNameMap[entry.memberId] || '알 수 없음',
                        amount: -net,
                    });
                }
            });

            let payerIndex = 0;
            let receiverIndex = 0;

            while (payerIndex < payers.length && receiverIndex < receivers.length) {
                const payer = payers[payerIndex];
                const receiver = receivers[receiverIndex];
                const amount = Math.min(payer.amount, receiver.amount);

                if (amount > 1e-2) {
                    instructions.push({
                        currency,
                        from: payer.name,
                        to: receiver.name,
                        amount,
                    });
                }

                payer.amount -= amount;
                receiver.amount -= amount;

                if (payer.amount <= 1e-2) {
                    payerIndex += 1;
                }
                if (receiver.amount <= 1e-2) {
                    receiverIndex += 1;
                }
            }
        });

        return {
            totalByCurrency,
            perPersonShare,
            instructions,
        };
    }, [sharedExpenses, travelPlan?.members, memberNameMap]);

    const formatExpenseDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}월 ${day}일`;
    };

    // 데이터 로드
    const loadExpenses = useCallback(async () => {
        if (!planId) return;

        try {
            setIsLoading(true);
            const result = await getExpensesByPlan(planId);
            setExpenses(result.expenses);
            setSummary(result.summary);
        } catch (error) {
            console.error('Failed to load expenses:', error);
        } finally {
            setIsLoading(false);
        }
    }, [planId, getExpensesByPlan]);

    useFocusEffect(
        useCallback(() => {
            loadExpenses();
        }, [loadExpenses])
    );

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadExpenses();
        setIsRefreshing(false);
    };

    const handleClose = () => {
        router.back();
    };

    // 일자별로 그룹화
    const groupedExpenses: DayExpenses[] = [];
    if (travelPlan) {
        travelPlan.days.forEach(day => {
            const dayExpenses = expenses.filter(e => e.dayNumber === day.dayNumber);
            if (dayExpenses.length > 0) {
                groupedExpenses.push({
                    dayNumber: day.dayNumber,
                    date: day.displayDate,
                    expenses: dayExpenses,
                });
            }
        });
    }

    // 필터링된 expenses
    const filteredGroupedExpenses = selectedFilter === '전체'
        ? groupedExpenses
        : groupedExpenses.filter(g => `${g.dayNumber}일차` === selectedFilter);

    // placeId로 장소명 가져오기
    const getPlaceName = (placeId?: string) => {
        if (!placeId || !travelPlan) return '';

        for (const day of travelPlan.days) {
            const place = day.places.find(p => p.id === placeId);
            if (place) {
                return place.name;
            }
        }
        return '';
    };

    // 금액 포맷팅
    const formatAmount = (amount: number, currency: string = 'KRW') => {
        const currencySymbols: { [key: string]: string } = {
            'KRW': '₩',
            'USD': '$',
            'JPY': '¥',
            'EUR': '€',
            'CNY': '¥',
            'GBP': '£',
        };

        const symbol = currencySymbols[currency] || currency;

        // 달러와 유로는 앞에, 나머지는 뒤에
        if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
            return `${symbol}${amount.toLocaleString()}`;
        }
        return `${amount.toLocaleString()}${symbol}`;
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
                    style={[styles.tab, selectedTab === '가계부' && styles.tabActive]}
                    onPress={() => setSelectedTab('가계부')}
                >
                    <Text style={[styles.tabText, selectedTab === '가계부' && styles.tabTextActive]}>
                        가계부
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === '정산표' && styles.tabActive]}
                    onPress={() => setSelectedTab('정산표')}
                >
                    <Text style={[styles.tabText, selectedTab === '정산표' && styles.tabTextActive]}>
                        정산표
                    </Text>
                </TouchableOpacity>
            </View>

            {selectedTab === '가계부' ? (
                <>
                    {/* 일자 필터 */}
                    <View style={styles.filterContainer}>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedFilter === '전체' && styles.filterButtonActive]}
                            onPress={() => setSelectedFilter('전체')}
                        >
                            <Text style={[styles.filterButtonText, selectedFilter === '전체' && styles.filterButtonTextActive]}>
                                전체
                            </Text>
                        </TouchableOpacity>
                        {travelPlan?.days.map((day) => (
                            <TouchableOpacity
                                key={day.id}
                                style={[styles.filterButton, selectedFilter === `${day.dayNumber}일차` && styles.filterButtonActive]}
                                onPress={() => setSelectedFilter(`${day.dayNumber}일차` as any)}
                            >
                                <Text style={[styles.filterButtonText, selectedFilter === `${day.dayNumber}일차` && styles.filterButtonTextActive]}>
                                    {day.dayNumber}일차
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 지출 내역 */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                        }
                    >
                        {filteredGroupedExpenses.map((dayGroup) => {
                            const personalExpenses = dayGroup.expenses.filter(e => e.type === 'PERSONAL');
                            const sharedExpenses = dayGroup.expenses.filter(e => e.type === 'SHARED');

                            return (
                                <View key={dayGroup.dayNumber} style={styles.daySection}>
                                    <Text style={styles.daySectionTitle}>
                                        {dayGroup.dayNumber}일차   {dayGroup.date}
                                    </Text>

                                    {/* 개인 지출 섹션 */}
                                    {personalExpenses.length > 0 && (
                                        <View style={styles.typeSection}>
                                            <View style={styles.typeBadgeHeader}>
                                                <Text style={styles.typeBadgeHeaderText}>개인</Text>
                                            </View>
                                            {personalExpenses.map((expense) => (
                                                <View key={expense.id} style={styles.expenseItem}>
                                                    <View style={styles.expenseItemRow}>
                                                        <Text style={styles.expenseItemTitle}>{expense.title}</Text>
                                                        <Text style={styles.expenseItemAmount}>
                                                            {formatAmount(expense.amount, expense.currency)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.expenseItemSubtitleRow}>
                                                        <Text style={styles.expenseItemSubtitle}>
                                                            {getPlaceName(expense.placeId)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* 개인/공용 사이 구분선 */}
                                    {personalExpenses.length > 0 && sharedExpenses.length > 0 && (
                                        <View style={styles.typeSeparator} />
                                    )}

                                    {/* 공용 지출 섹션 */}
                                    {sharedExpenses.length > 0 && (
                                        <View style={styles.typeSection}>
                                            <View style={styles.typeBadgeHeader}>
                                                <Text style={styles.typeBadgeHeaderText}>공용</Text>
                                            </View>
                                            {sharedExpenses.map((expense) => (
                                                <View key={expense.id} style={styles.expenseItem}>
                                                    <View style={styles.expenseItemRow}>
                                                        <Text style={styles.expenseItemTitle}>{expense.title}</Text>
                                                        <Text style={styles.expenseItemAmount}>
                                                            {formatAmount(expense.amount, expense.currency)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.expenseItemSubtitleRow}>
                                                        <Text style={styles.expenseItemSubtitle}>
                                                            {getPlaceName(expense.placeId)}
                                                        </Text>
                                                        <Text style={styles.expenseItemPayer}>
                                                            {expense.paidByName}님 결제
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {filteredGroupedExpenses.length === 0 && !isLoading && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>아직 등록된 지출이 없습니다</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* 하단 총 지출 금액 */}
                    <View style={styles.footer}>
                        <Text style={styles.footerLabel}>총 지출금액</Text>
                        <View style={styles.footerAmountContainer}>
                            {Object.entries(myTotalExpensesByCurrency).length === 0 ? (
                                <Text style={styles.footerAmount}>
                                    {formatAmount(0)}
                                </Text>
                            ) : (
                                Object.entries(myTotalExpensesByCurrency).map(([currency, amount], index) => (
                                    <Text key={currency} style={styles.footerAmount}>
                                        {formatAmount(amount, currency)}
                                        {index < Object.entries(myTotalExpensesByCurrency).length - 1 && ' + '}
                                    </Text>
                                ))
                            )}
                        </View>
                    </View>
                </>
            ) : (
                /* 정산표 탭 */
                <View style={styles.settlementContainer}>
                    <ScrollView
                        style={styles.settlementContent}
                        contentContainerStyle={[
                            styles.settlementContentContainer,
                            { paddingBottom: SETTLEMENT_COLLAPSED_HEIGHT + 32 },
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        {sharedExpenseGroups.map((group) => (
                            <View key={`${group.payerId}-${group.currency}`} style={styles.settlementSection}>
                                <View style={styles.settlementBadge}>
                                    <Text style={styles.settlementBadgeText}>
                                        {group.payerName} 님 결제
                                    </Text>
                                </View>
                                {group.expenses.map((expense) => (
                                    <View key={expense.id} style={styles.settlementItem}>
                                        <View style={styles.settlementItemRow}>
                                            <Text style={styles.settlementItemTitle}>{expense.title}</Text>
                                            <Text style={styles.settlementItemAmount}>
                                                -{formatAmount(expense.amount, expense.currency)}
                                            </Text>
                                        </View>
                                        <View style={styles.settlementItemSubRow}>
                                            <Text style={styles.settlementItemSubtitle}>
                                                {getPlaceName(expense.placeId)}
                                            </Text>
                                            <Text style={styles.settlementItemDate}>
                                                {formatExpenseDate(expense.expenseDate || expense.createdAt)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                                <View style={styles.settlementTotalRow}>
                                    <Text style={styles.settlementTotalLabel}>총 지출 금액</Text>
                                    <Text style={styles.settlementTotalAmount}>
                                        {formatAmount(group.totalAmount, group.currency)}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {sharedExpenseGroups.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>공용 지출이 없습니다</Text>
                            </View>
                        )}
                    </ScrollView>

                    <Animated.View style={[styles.settlementSheet, { height: sheetHeight }]}>
                        <View style={styles.settlementHandleArea} {...panResponder.panHandlers}>
                            <View style={styles.settlementHandle} />
                        </View>
                        <ScrollView
                            style={styles.settlementSheetScroll}
                            contentContainerStyle={styles.settlementSheetScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.settlementPerPerson}>
                                <Text style={styles.settlementPerPersonLabel}>1인당 부담</Text>
                                <View style={styles.settlementPerPersonAmountContainer}>
                                    {Object.entries(settlementSummary.perPersonShare).length > 0 ? (
                                        Object.entries(settlementSummary.perPersonShare).map(([currency, amount]) => (
                                            <Text key={currency} style={styles.settlementPerPersonAmount}>
                                                {formatAmount(amount, currency)}
                                            </Text>
                                        ))
                                    ) : (
                                        <Text style={styles.settlementPerPersonAmount}>
                                            {formatAmount(0)}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.settlementResultSection}>
                                <Text style={styles.settlementResultLabel}>정산 결과</Text>
                                {settlementSummary.instructions.length > 0 ? (
                                    settlementSummary.instructions.map((instruction, index) => (
                                        <View
                                            key={`${instruction.from}-${instruction.to}-${instruction.currency}-${index}`}
                                            style={styles.settlementResultRow}
                                        >
                                            <Text style={styles.settlementResultText}>
                                                {instruction.from} → {instruction.to}
                                            </Text>
                                            <Text style={styles.settlementResultAmount}>
                                                {formatAmount(instruction.amount, instruction.currency)}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.settlementResultEmptyText}>정산할 내역이 없습니다</Text>
                                )}
                            </View>
                        </ScrollView>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 16,
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
        backgroundColor: '#E5E5E5',
        borderRadius: 20,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 16,
    },
    tabActive: {
        backgroundColor: '#fff',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '400',
        color: '#9E9E9E',
    },
    tabTextActive: {
        fontWeight: '600',
        color: '#000',
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    filterButton: {
        backgroundColor: '#C7C7C7',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#088CDA',
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 18,
        color: '#fff',
    },
    filterButtonTextActive: {
        fontWeight: '400',
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    daySection: {
        marginBottom: 24,
    },
    daySectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    typeSection: {
        gap: 8,
    },
    typeBadgeHeader: {
        backgroundColor: '#088CDA',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
    },
    typeBadgeHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        lineHeight: 18,
    },
    typeSeparator: {
        height: 16,
        backgroundColor: '#F6F6F6',
        opacity: 0.6,
        marginVertical: 8,
        marginHorizontal: -20,
        width: '120%',
    },
    expenseItem: {
        marginBottom: 16,
    },
    expenseItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    expenseItemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        lineHeight: 20,
        flex: 1,
    },
    expenseItemAmount: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        lineHeight: 20,
    },
    expenseItemSubtitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    expenseItemSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#585858',
        lineHeight: 18,
        flex: 1,
    },
    expenseItemPayer: {
        fontSize: 14,
        fontWeight: '600',
        color: '#585858',
        lineHeight: 18,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 17,
        color: '#9E9E9E',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    footerLabel: {
        fontSize: 19,
        fontWeight: '600',
        color: '#000',
    },
    footerAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    footerAmount: {
        fontSize: 26,
        fontWeight: '700',
        color: '#000',
    },
    settlementContainer: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
    settlementContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    settlementContentContainer: {
        paddingBottom: 32,
    },
    settlementSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    settlementBadge: {
        backgroundColor: '#088CDA',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    settlementBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    settlementItem: {
        marginBottom: 16,
    },
    settlementItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    settlementItemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        flex: 1,
        marginRight: 12,
        lineHeight: 20,
    },
    settlementItemAmount: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    settlementItemSubRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settlementItemSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#585858',
        flex: 1,
        marginRight: 12,
    },
    settlementItemDate: {
        fontSize: 13,
        fontWeight: '500',
        color: '#9E9E9E',
    },
    settlementTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    settlementTotalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    settlementTotalAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    settlementHandle: {
        width: 60,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D9D9D9',
    },
    settlementSheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
        elevation: 6,
    },
    settlementHandleArea: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    settlementSheetScroll: {
        flex: 1,
        paddingHorizontal: 20,
    },
    settlementSheetScrollContent: {
        paddingBottom: 24,
        gap: 20,
    },
    settlementPerPerson: {
        marginBottom: 20,
        gap: 8,
    },
    settlementPerPersonLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    settlementPerPersonAmountContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    settlementPerPersonAmount: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
    },
    settlementResultSection: {
        gap: 12,
    },
    settlementResultLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    settlementResultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settlementResultText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
        flex: 1,
        marginRight: 12,
    },
    settlementResultAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#088CDA',
    },
    settlementResultEmptyText: {
        fontSize: 14,
        color: '#9E9E9E',
    },
});

