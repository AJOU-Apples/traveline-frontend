import { travelPlanApi } from '../utils/travelPlanApi';
import type { Expense } from '../types/expense.types';
import type { TravelPlan } from '../types/travelPlan.types';
import type { AuthUser } from '../types/user.types';

export const useExpense = (
    authUser: AuthUser | null,
    travelPlans: TravelPlan[],
    setTravelPlans: React.Dispatch<React.SetStateAction<TravelPlan[]>>
) => {
    const createExpense = async (
        planId: string,
        dayNumber: number,
        placeId: string,
        expense: {
            title: string;
            amount: number;
            currency?: string;
            type: 'PERSONAL' | 'SHARED';
            paidById?: string;
            splitWith?: string[];
            memo?: string;
            expenseDate?: string;
            expenseTime?: string;
        }
    ): Promise<Expense> => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const createdExpense = await travelPlanApi.createExpense({
                travelPlanId: parseInt(planId),
                dayNumber: dayNumber,
                placeId: parseInt(placeId),
                title: expense.title,
                amount: expense.amount,
                currency: expense.currency,
                type: expense.type,
                paidById: expense.paidById ? parseInt(expense.paidById) : undefined,
                splitWith: expense.splitWith?.map((id) => parseInt(id)),
                memo: expense.memo,
                expenseDate: expense.expenseDate,
                expenseTime: expense.expenseTime,
            });

            const newExpense: Expense = {
                id: createdExpense.id.toString(),
                travelPlanId: createdExpense.travelPlanId.toString(),
                travelDayId: createdExpense.travelDayId?.toString(),
                dayNumber: createdExpense.dayNumber,
                placeId: createdExpense.placeId?.toString(),
                paidById: createdExpense.paidById.toString(),
                paidByName: createdExpense.paidByName,
                title: createdExpense.title,
                amount: createdExpense.amount,
                currency: createdExpense.currency,
                type: createdExpense.type,
                splitWith: createdExpense.splitWith?.map((id) => id.toString()),
                splitAmount: createdExpense.splitAmount,
                isSettled: createdExpense.isSettled,
                receiptImage: createdExpense.receiptImage,
                memo: createdExpense.memo,
                expenseDate: createdExpense.expenseDate,
                expenseTime: createdExpense.expenseTime,
                createdAt: createdExpense.createdAt,
                updatedAt: createdExpense.updatedAt,
            };

            // 상태 업데이트
            setTravelPlans((prev) =>
                prev.map((plan) => {
                    if (plan.id !== planId) return plan;

                    return {
                        ...plan,
                        days: plan.days.map((day) => {
                            if (day.dayNumber !== dayNumber) return day;

                            return {
                                ...day,
                                places: day.places.map((place) => {
                                    if (place.id !== placeId) return place;

                                    return {
                                        ...place,
                                        expenses: [...(place.expenses || []), newExpense],
                                    };
                                }),
                            };
                        }),
                    };
                })
            );

            return newExpense;
        } catch (error) {
            console.error('Failed to create expense:', error);
            throw error;
        }
    };

    const getExpensesByPlace = async (placeId: string): Promise<Expense[]> => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const expenses = await travelPlanApi.getExpensesByPlace(parseInt(placeId));

            const convertedExpenses = expenses.map((expense) => ({
                id: expense.id.toString(),
                travelPlanId: expense.travelPlanId.toString(),
                travelDayId: expense.travelDayId?.toString(),
                dayNumber: expense.dayNumber,
                placeId: expense.placeId?.toString(),
                paidById: expense.paidById.toString(),
                paidByName: expense.paidByName,
                title: expense.title,
                amount: expense.amount,
                currency: expense.currency,
                type: expense.type,
                splitWith: expense.splitWith?.map((id) => id.toString()),
                splitAmount: expense.splitAmount,
                isSettled: expense.isSettled,
                receiptImage: expense.receiptImage,
                memo: expense.memo,
                expenseDate: expense.expenseDate,
                expenseTime: expense.expenseTime,
                createdAt: expense.createdAt,
                updatedAt: expense.updatedAt,
            }));

            // 상태 업데이트 - 기존 place의 다른 속성들(memos, photos 등)을 보존
            setTravelPlans((prev) =>
                prev.map((plan) => ({
                    ...plan,
                    days: plan.days.map((day) => ({
                        ...day,
                        places: day.places.map((place) => {
                            if (place.id === placeId) {
                                return {
                                    ...place,
                                    expenses: convertedExpenses,
                                    // 스프레드 연산자로 인해 다른 속성들(memos, photos 등)이 자동으로 보존됨
                                };
                            }
                            return place;
                        }),
                    })),
                }))
            );

            return convertedExpenses;
        } catch (error) {
            console.error('Failed to get expenses by place:', error);
            throw error;
        }
    };

    const getExpensesByPlan = async (planId: string, type?: 'PERSONAL' | 'SHARED') => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const result = await travelPlanApi.getExpensesByTravelPlan(parseInt(planId), type);

            const convertedExpenses = result.expenses.map((expense) => ({
                id: expense.id.toString(),
                travelPlanId: expense.travelPlanId.toString(),
                travelDayId: expense.travelDayId?.toString(),
                dayNumber: expense.dayNumber,
                placeId: expense.placeId?.toString(),
                paidById: expense.paidById.toString(),
                paidByName: expense.paidByName,
                title: expense.title,
                amount: expense.amount,
                currency: expense.currency,
                type: expense.type,
                splitWith: expense.splitWith?.map((id) => id.toString()),
                splitAmount: expense.splitAmount,
                isSettled: expense.isSettled,
                receiptImage: expense.receiptImage,
                memo: expense.memo,
                expenseDate: expense.expenseDate,
                expenseTime: expense.expenseTime,
                createdAt: expense.createdAt,
                updatedAt: expense.updatedAt,
            }));

            return {
                expenses: convertedExpenses,
                summary: result.summary,
            };
        } catch (error) {
            console.error('Failed to get expenses by plan:', error);
            throw error;
        }
    };

    const updateExpense = async (
        expenseId: string,
        updates: {
            title?: string;
            amount?: number;
            type?: 'PERSONAL' | 'SHARED';
            paidById?: string;
            splitWith?: string[];
            isSettled?: boolean;
            memo?: string;
            expenseDate?: string;
            expenseTime?: string;
        }
    ): Promise<Expense> => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const updatedExpense = await travelPlanApi.updateExpense(
                parseInt(expenseId),
                {
                    ...updates,
                    paidById: updates.paidById ? parseInt(updates.paidById) : undefined,
                    splitWith: updates.splitWith?.map((id) => parseInt(id)),
                }
            );

            const convertedExpense: Expense = {
                id: updatedExpense.id.toString(),
                travelPlanId: updatedExpense.travelPlanId.toString(),
                travelDayId: updatedExpense.travelDayId?.toString(),
                dayNumber: updatedExpense.dayNumber,
                placeId: updatedExpense.placeId?.toString(),
                paidById: updatedExpense.paidById.toString(),
                paidByName: updatedExpense.paidByName,
                title: updatedExpense.title,
                amount: updatedExpense.amount,
                currency: updatedExpense.currency,
                type: updatedExpense.type,
                splitWith: updatedExpense.splitWith?.map((id) => id.toString()),
                splitAmount: updatedExpense.splitAmount,
                isSettled: updatedExpense.isSettled,
                receiptImage: updatedExpense.receiptImage,
                memo: updatedExpense.memo,
                expenseDate: updatedExpense.expenseDate,
                expenseTime: updatedExpense.expenseTime,
                createdAt: updatedExpense.createdAt,
                updatedAt: updatedExpense.updatedAt,
            };

            // 상태 업데이트
            setTravelPlans((prev) =>
                prev.map((plan) => ({
                    ...plan,
                    days: plan.days.map((day) => ({
                        ...day,
                        places: day.places.map((place) => {
                            if (place.id !== convertedExpense.placeId) {
                                return place;
                            }

                            const existingExpenses = place.expenses ?? [];
                            const expenseIndex = existingExpenses.findIndex((expense) => expense.id === expenseId);

                            let nextExpenses: Expense[];
                            if (expenseIndex >= 0) {
                                nextExpenses = existingExpenses.map((expense, index) =>
                                    index === expenseIndex ? convertedExpense : expense
                                );
                            } else {
                                nextExpenses = [...existingExpenses, convertedExpense];
                            }

                            return {
                                ...place,
                                expenses: nextExpenses,
                            };
                        }),
                    })),
                }))
            );

            // 최신 데이터를 보장하기 위해 해당 장소의 지출 목록 재조회
            if (convertedExpense.placeId) {
                getExpensesByPlace(convertedExpense.placeId).catch((error) =>
                    console.error('Failed to refresh expenses after update:', error)
                );
            }

            return convertedExpense;
        } catch (error) {
            console.error('Failed to update expense:', error);
            throw error;
        }
    };

    const deleteExpense = async (expenseId: string) => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            await travelPlanApi.deleteExpense(parseInt(expenseId));

            // 상태 업데이트
            setTravelPlans((prev) =>
                prev.map((plan) => ({
                    ...plan,
                    days: plan.days.map((day) => ({
                        ...day,
                        places: day.places.map((place) => ({
                            ...place,
                            expenses: place.expenses?.filter((expense) => expense.id !== expenseId),
                        })),
                    })),
                }))
            );
        } catch (error) {
            console.error('Failed to delete expense:', error);
            throw error;
        }
    };

    return {
        createExpense,
        getExpensesByPlace,
        getExpensesByPlan,
        updateExpense,
        deleteExpense,
    };
};

