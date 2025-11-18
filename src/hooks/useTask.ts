import { travelPlanApi } from '../utils/travelPlanApi';
import type { Task } from '../types/task.types';
import type { AuthUser } from '../types/user.types';

export const useTask = (authUser: AuthUser | null) => {
  const getTasksByPlan = async (planId: string): Promise<Task[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const tasks = await travelPlanApi.getTasksByTravelPlan(parseInt(planId));
      return tasks.map((task) => ({
        id: task.id.toString(),
        travelPlanId: task.travelPlanId.toString(),
        text: task.text,
        deadline: task.deadline,
        memo: task.memo,
        checked: task.checked,
        checkedAt: task.checkedAt,
        orderIndex: task.orderIndex,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw error;
    }
  };

  const createTask = async (planId: string, task: Omit<Task, 'id' | 'travelPlanId' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const createdTask = await travelPlanApi.createTask(parseInt(planId), {
        text: task.text,
        deadline: task.deadline,
        memo: task.memo,
        orderIndex: task.orderIndex,
      });

      return {
        id: createdTask.id.toString(),
        travelPlanId: createdTask.travelPlanId.toString(),
        text: createdTask.text,
        deadline: createdTask.deadline,
        memo: createdTask.memo,
        checked: createdTask.checked,
        checkedAt: createdTask.checkedAt,
        orderIndex: createdTask.orderIndex,
        createdAt: createdTask.createdAt,
        updatedAt: createdTask.updatedAt,
      };
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedTask = await travelPlanApi.updateTask(parseInt(taskId), {
        text: updates.text,
        deadline: updates.deadline,
        memo: updates.memo,
        checked: updates.checked,
        orderIndex: updates.orderIndex,
      });

      return {
        id: updatedTask.id.toString(),
        travelPlanId: updatedTask.travelPlanId.toString(),
        text: updatedTask.text,
        deadline: updatedTask.deadline,
        memo: updatedTask.memo,
        checked: updatedTask.checked,
        checkedAt: updatedTask.checkedAt,
        orderIndex: updatedTask.orderIndex,
        createdAt: updatedTask.createdAt,
        updatedAt: updatedTask.updatedAt,
      };
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await travelPlanApi.deleteTask(parseInt(taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  };

  return {
    getTasksByPlan,
    createTask,
    updateTask,
    deleteTask,
  };
};

