import { travelPlanApi } from '../utils/travelPlanApi';
import type { Memo } from '../types/memo.types';
import type { TravelPlan } from '../types/travelPlan.types';
import type { AuthUser } from '../types/user.types';

export const usePlaceMemo = (
  authUser: AuthUser | null,
  travelPlans: TravelPlan[],
  setTravelPlans: React.Dispatch<React.SetStateAction<TravelPlan[]>>
) => {
  const createMemo = async (placeId: string, content: string, visibility?: 'PERSONAL' | 'SHARED'): Promise<Memo> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const createdMemo = await travelPlanApi.createMemo({
        placeId: parseInt(placeId),
        content: content,
        visibility: visibility,
      });

      const newMemo: Memo = {
        id: createdMemo.id.toString(),
        placeId: createdMemo.placeId.toString(),
        author: {
          id: createdMemo.author.id.toString(),
          email: createdMemo.author.email,
          name: createdMemo.author.name,
          username: createdMemo.author.username,
          profileImageUrl: createdMemo.author.profileImageUrl,
        },
        content: createdMemo.content,
        visibility: createdMemo.visibility,
        createdAt: createdMemo.createdAt,
        updatedAt: createdMemo.updatedAt,
      };

      // 상태 업데이트
      setTravelPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          days: plan.days.map((day) => ({
            ...day,
            places: day.places.map((place) => {
              if (place.id === placeId) {
                return {
                  ...place,
                  memos: [...(place.memos || []), newMemo],
                };
              }
              return place;
            }),
          })),
        }))
      );

      return newMemo;
    } catch (error) {
      console.error('Failed to create memo:', error);
      throw error;
    }
  };

  const getMemosByPlace = async (placeId: string): Promise<Memo[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const memos = await travelPlanApi.getMemosByPlace(parseInt(placeId));

      const convertedMemos = memos.map((memo) => ({
        id: memo.id.toString(),
        placeId: memo.placeId.toString(),
        author: {
          id: memo.author.id.toString(),
          email: memo.author.email,
          name: memo.author.name,
          username: memo.author.username,
          profileImageUrl: memo.author.profileImageUrl,
        },
        content: memo.content,
        visibility: memo.visibility,
        createdAt: memo.createdAt,
        updatedAt: memo.updatedAt,
      }));

      // 상태 업데이트 - 기존 place의 다른 속성들(expenses, photos 등)을 보존
      setTravelPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          days: plan.days.map((day) => ({
            ...day,
            places: day.places.map((place) => {
              if (place.id === placeId) {
                return {
                  ...place,
                  memos: convertedMemos,
                  // 스프레드 연산자로 인해 다른 속성들(expenses, photos 등)이 자동으로 보존됨
                };
              }
              return place;
            }),
          })),
        }))
      );

      return convertedMemos;
    } catch (error) {
      console.error('Failed to get memos:', error);
      throw error;
    }
  };

  const updateMemo = async (memoId: string, content?: string, visibility?: 'PERSONAL' | 'SHARED'): Promise<Memo> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedMemo = await travelPlanApi.updateMemo(parseInt(memoId), {
        content: content,
        visibility: visibility,
      });

      const memo: Memo = {
        id: updatedMemo.id.toString(),
        placeId: updatedMemo.placeId.toString(),
        author: {
          id: updatedMemo.author.id.toString(),
          email: updatedMemo.author.email,
          name: updatedMemo.author.name,
          username: updatedMemo.author.username,
          profileImageUrl: updatedMemo.author.profileImageUrl,
        },
        content: updatedMemo.content,
        visibility: updatedMemo.visibility,
        createdAt: updatedMemo.createdAt,
        updatedAt: updatedMemo.updatedAt,
      };

      // 상태 업데이트
      setTravelPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          days: plan.days.map((day) => ({
            ...day,
            places: day.places.map((place) => ({
              ...place,
              memos: place.memos?.map((m) => (m.id === memoId ? memo : m)),
            })),
          })),
        }))
      );

      return memo;
    } catch (error) {
      console.error('Failed to update memo:', error);
      throw error;
    }
  };

  const deleteMemo = async (memoId: string): Promise<void> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await travelPlanApi.deleteMemo(parseInt(memoId));

      // 상태 업데이트
      setTravelPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          days: plan.days.map((day) => ({
            ...day,
            places: day.places.map((place) => ({
              ...place,
              memos: place.memos?.filter((m) => m.id !== memoId),
            })),
          })),
        }))
      );
    } catch (error) {
      console.error('Failed to delete memo:', error);
      throw error;
    }
  };

  return {
    createMemo,
    getMemosByPlace,
    updateMemo,
    deleteMemo,
  };
};

