import { travelPlanApi } from '../utils/travelPlanApi';
import type { Supply } from '../types/supply.types';
import type { AuthUser } from '../types/user.types';

export const useSupply = (authUser: AuthUser | null) => {
  const getSuppliesByPlan = async (planId: string): Promise<Supply[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const supplies = await travelPlanApi.getSuppliesByTravelPlan(parseInt(planId));
      return supplies.map((supply) => ({
        id: supply.id.toString(),
        travelPlanId: supply.travelPlanId.toString(),
        text: supply.text,
        quantity: supply.quantity,
        unit: supply.unit,
        category: supply.category,
        memo: supply.memo,
        checked: supply.checked,
        checkedAt: supply.checkedAt,
        orderIndex: supply.orderIndex,
        createdAt: supply.createdAt,
        updatedAt: supply.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get supplies:', error);
      throw error;
    }
  };

  const createSupply = async (planId: string, supply: Omit<Supply, 'id' | 'travelPlanId' | 'createdAt' | 'updatedAt'>): Promise<Supply> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const createdSupply = await travelPlanApi.createSupply(parseInt(planId), {
        text: supply.text,
        quantity: supply.quantity,
        unit: supply.unit,
        category: supply.category,
        memo: supply.memo,
        orderIndex: supply.orderIndex,
      });

      return {
        id: createdSupply.id.toString(),
        travelPlanId: createdSupply.travelPlanId.toString(),
        text: createdSupply.text,
        quantity: createdSupply.quantity,
        unit: createdSupply.unit,
        category: createdSupply.category,
        memo: createdSupply.memo,
        checked: createdSupply.checked,
        checkedAt: createdSupply.checkedAt,
        orderIndex: createdSupply.orderIndex,
        createdAt: createdSupply.createdAt,
        updatedAt: createdSupply.updatedAt,
      };
    } catch (error) {
      console.error('Failed to create supply:', error);
      throw error;
    }
  };

  const updateSupply = async (supplyId: string, updates: Partial<Supply>): Promise<Supply> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedSupply = await travelPlanApi.updateSupply(parseInt(supplyId), {
        text: updates.text,
        quantity: updates.quantity,
        unit: updates.unit,
        category: updates.category,
        memo: updates.memo,
        checked: updates.checked,
        orderIndex: updates.orderIndex,
      });

      return {
        id: updatedSupply.id.toString(),
        travelPlanId: updatedSupply.travelPlanId.toString(),
        text: updatedSupply.text,
        quantity: updatedSupply.quantity,
        unit: updatedSupply.unit,
        category: updatedSupply.category,
        memo: updatedSupply.memo,
        checked: updatedSupply.checked,
        checkedAt: updatedSupply.checkedAt,
        orderIndex: updatedSupply.orderIndex,
        createdAt: updatedSupply.createdAt,
        updatedAt: updatedSupply.updatedAt,
      };
    } catch (error) {
      console.error('Failed to update supply:', error);
      throw error;
    }
  };

  const deleteSupply = async (supplyId: string): Promise<void> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await travelPlanApi.deleteSupply(parseInt(supplyId));
    } catch (error) {
      console.error('Failed to delete supply:', error);
      throw error;
    }
  };

  return {
    getSuppliesByPlan,
    createSupply,
    updateSupply,
    deleteSupply,
  };
};

