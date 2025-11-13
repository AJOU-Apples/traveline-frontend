import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, RefreshControl } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUser, type Expense } from '../src/context/UserContext';

type DayExpenses = {
    dayNumber: number;
    date: string;
    expenses: Expense[];
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
                <View style={styles.comingSoonContainer}>
                    <Text style={styles.comingSoonText}>정산표는 추후 구현 예정입니다</Text>
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
    comingSoonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    comingSoonText: {
        fontSize: 17,
        color: '#9E9E9E',
    },
});

