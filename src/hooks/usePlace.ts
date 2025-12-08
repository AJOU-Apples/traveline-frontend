import { travelPlanApi } from '../utils/travelPlanApi';
import type { Place, TravelPlan } from '../types/travelPlan.types';
import type { AuthUser } from '../types/user.types';

export const usePlace = (
  authUser: AuthUser | null,
  travelPlans: TravelPlan[],
  setTravelPlans: React.Dispatch<React.SetStateAction<TravelPlan[]>>
) => {
  const addPlaceToDay = async (planId: string, dayNumber: number, place: Omit<Place, 'id'>) => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const createdPlace = await travelPlanApi.addPlace({
        travelPlanId: parseInt(planId),
        dayNumber: dayNumber,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
        time: place.time,
        memo: place.memo,
      });

      const newPlace: Place = {
        id: createdPlace.id.toString(),
        travelPlanId: createdPlace.travelPlanId.toString(),
        travelDayId: createdPlace.travelDayId.toString(),
        dayNumber: createdPlace.dayNumber,
        name: createdPlace.name,
        address: createdPlace.address,
        latitude: createdPlace.latitude,
        longitude: createdPlace.longitude,
        placeId: createdPlace.placeId,
        time: createdPlace.time,
        orderIndex: createdPlace.orderIndex,
        memo: createdPlace.memo,
        personalMemos: createdPlace.personalMemos,
        isVisited: createdPlace.isVisited,
        visitedAt: createdPlace.visitedAt,
        photos: [],
        expenses: [],
      };

      setTravelPlans((prev) =>
        prev.map((plan) => {
          if (plan.id !== planId) return plan;

          return {
            ...plan,
            days: plan.days.map((day) => {
              if (day.dayNumber !== dayNumber) return day;

              return {
                ...day,
                places: [...day.places, newPlace],
              };
            }),
          };
        })
      );
    } catch (error) {
      console.error('Failed to add place:', error);
      throw error;
    }
  };

  const getPlacesByDay = async (planId: string, dayNumber: number): Promise<Place[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const places = await travelPlanApi.getPlacesByDay(parseInt(planId), dayNumber);

      const convertedPlaces = places.map(place => ({
        id: place.id.toString(),
        travelPlanId: place.travelPlanId.toString(),
        travelDayId: place.travelDayId.toString(),
        dayNumber: place.dayNumber,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
        time: place.time,
        orderIndex: place.orderIndex,
        memo: place.memo,
        personalMemos: place.personalMemos,
        isVisited: place.isVisited,
        visitedAt: place.visitedAt,
        photos: [],
        expenses: [],
        likes: place.likes,
        isLiked: place.isLiked,
        likedBy: place.likedBy,
      }));

      // travelPlans 상태 업데이트 - 해당 day의 places를 업데이트
      setTravelPlans(prevPlans =>
        prevPlans.map(plan => {
          if (plan.id === planId) {
            return {
              ...plan,
              days: plan.days.map(day => {
                if (day.dayNumber === dayNumber) {
                  return {
                    ...day,
                    places: convertedPlaces,
                  };
                }
                return day;
              }),
            };
          }
          return plan;
        })
      );

      return convertedPlaces;
    } catch (error) {
      console.error('Failed to get places:', error);
      throw error;
    }
  };

  const deletePlaceFromDay = async (planId: string, dayNumber: number, placeId: string) => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await travelPlanApi.deletePlace(parseInt(placeId));

      setTravelPlans((prev) =>
        prev.map((plan) => {
          if (plan.id !== planId) return plan;

          return {
            ...plan,
            days: plan.days.map((day) => {
              if (day.dayNumber !== dayNumber) return day;

              return {
                ...day,
                places: day.places.filter((place) => place.id !== placeId),
              };
            }),
          };
        })
      );
    } catch (error) {
      console.error('Failed to delete place:', error);
      throw error;
    }
  };

  const reorderPlaces = async (planId: string, dayNumber: number, placeIds: string[]) => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const reorderedPlaces = await travelPlanApi.reorderPlaces({
        travelPlanId: parseInt(planId),
        dayNumber: dayNumber,
        placeIds: placeIds.map(id => parseInt(id)),
      });

      // 백엔드 응답으로 상태 업데이트
      const convertedPlaces: Place[] = reorderedPlaces.map(place => ({
        id: place.id.toString(),
        travelPlanId: place.travelPlanId.toString(),
        travelDayId: place.travelDayId.toString(),
        dayNumber: place.dayNumber,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
        time: place.time,
        orderIndex: place.orderIndex,
        memo: place.memo,
        personalMemos: place.personalMemos,
        isVisited: place.isVisited,
        visitedAt: place.visitedAt,
        photos: [],
        expenses: [],
      }));

      setTravelPlans((prev) =>
        prev.map((plan) => {
          if (plan.id !== planId) return plan;

          return {
            ...plan,
            days: plan.days.map((day) => {
              if (day.dayNumber !== dayNumber) return day;

              return {
                ...day,
                places: convertedPlaces,
              };
            }),
          };
        })
      );
    } catch (error) {
      console.error('Failed to reorder places:', error);
      throw error;
    }
  };

  const updatePlaceMemo = async (planId: string, dayNumber: number, placeId: string, memo: string) => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedPlace = await travelPlanApi.updatePlaceMemo(parseInt(placeId), {
        type: 'shared',
        memo: memo,
      });

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
                    memo: updatedPlace.memo,
                    personalMemos: updatedPlace.personalMemos,
                  };
                }),
              };
            }),
          };
        })
      );
    } catch (error) {
      console.error('Failed to update place memo:', error);
      throw error;
    }
  };

  return {
    addPlaceToDay,
    getPlacesByDay,
    deletePlaceFromDay,
    reorderPlaces,
    updatePlaceMemo,
  };
};

