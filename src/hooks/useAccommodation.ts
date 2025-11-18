import { travelPlanApi } from '../utils/travelPlanApi';
import type { Accommodation } from '../types/accommodation.types';
import type { AuthUser } from '../types/user.types';

export const useAccommodation = (authUser: AuthUser | null) => {
  const getAccommodationsByPlan = async (planId: string): Promise<Accommodation[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const accommodations = await travelPlanApi.getAccommodationsByTravelPlan(parseInt(planId));

      return accommodations.map((accommodation) => ({
        id: accommodation.id.toString(),
        travelPlanId: accommodation.travelPlanId.toString(),
        name: accommodation.name,
        address: accommodation.address,
        latitude: accommodation.latitude,
        longitude: accommodation.longitude,
        placeId: accommodation.placeId,
        checkInDate: accommodation.checkInDate,
        checkInTime: accommodation.checkInTime,
        checkOutDate: accommodation.checkOutDate,
        checkOutTime: accommodation.checkOutTime,
        confirmationNumber: accommodation.confirmationNumber,
        price: accommodation.price,
        currency: accommodation.currency,
        isConfirmed: accommodation.isConfirmed,
        isSelected: accommodation.isSelected,
        phoneNumber: accommodation.phoneNumber,
        email: accommodation.email,
        bookingUrl: accommodation.bookingUrl,
        memo: accommodation.memo,
        createdBy: accommodation.createdBy,
        createdAt: accommodation.createdAt,
        updatedAt: accommodation.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get accommodations:', error);
      throw error;
    }
  };

  const createAccommodation = async (planId: string, accommodation: Omit<Accommodation, 'id' | 'travelPlanId' | 'createdAt' | 'updatedAt'>): Promise<Accommodation> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const createdAccommodation = await travelPlanApi.createAccommodation({
        travelPlanId: parseInt(planId),
        name: accommodation.name,
        address: accommodation.address,
        latitude: accommodation.latitude,
        longitude: accommodation.longitude,
        placeId: accommodation.placeId,
        checkInDate: accommodation.checkInDate,
        checkInTime: accommodation.checkInTime,
        checkOutDate: accommodation.checkOutDate,
        checkOutTime: accommodation.checkOutTime,
        confirmationNumber: accommodation.confirmationNumber,
        price: accommodation.price,
        currency: accommodation.currency,
        isConfirmed: accommodation.isConfirmed,
        isSelected: accommodation.isSelected,
        phoneNumber: accommodation.phoneNumber,
        email: accommodation.email,
        bookingUrl: accommodation.bookingUrl,
        memo: accommodation.memo,
      });

      return {
        id: createdAccommodation.id.toString(),
        travelPlanId: createdAccommodation.travelPlanId.toString(),
        name: createdAccommodation.name,
        address: createdAccommodation.address,
        latitude: createdAccommodation.latitude,
        longitude: createdAccommodation.longitude,
        placeId: createdAccommodation.placeId,
        checkInDate: createdAccommodation.checkInDate,
        checkInTime: createdAccommodation.checkInTime,
        checkOutDate: createdAccommodation.checkOutDate,
        checkOutTime: createdAccommodation.checkOutTime,
        confirmationNumber: createdAccommodation.confirmationNumber,
        price: createdAccommodation.price,
        currency: createdAccommodation.currency,
        isConfirmed: createdAccommodation.isConfirmed,
        isSelected: createdAccommodation.isSelected,
        phoneNumber: createdAccommodation.phoneNumber,
        email: createdAccommodation.email,
        bookingUrl: createdAccommodation.bookingUrl,
        memo: createdAccommodation.memo,
        createdBy: createdAccommodation.createdBy,
        createdAt: createdAccommodation.createdAt,
        updatedAt: createdAccommodation.updatedAt,
      };
    } catch (error) {
      console.error('Failed to create accommodation:', error);
      throw error;
    }
  };

  const updateAccommodation = async (accommodationId: string, updates: Partial<Accommodation>): Promise<Accommodation> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedAccommodation = await travelPlanApi.updateAccommodation(parseInt(accommodationId), {
        name: updates.name,
        address: updates.address,
        latitude: updates.latitude,
        longitude: updates.longitude,
        placeId: updates.placeId,
        checkInDate: updates.checkInDate,
        checkInTime: updates.checkInTime,
        checkOutDate: updates.checkOutDate,
        checkOutTime: updates.checkOutTime,
        confirmationNumber: updates.confirmationNumber,
        price: updates.price,
        currency: updates.currency,
        isConfirmed: updates.isConfirmed,
        isSelected: updates.isSelected,
        phoneNumber: updates.phoneNumber,
        email: updates.email,
        bookingUrl: updates.bookingUrl,
        memo: updates.memo,
      });

      return {
        id: updatedAccommodation.id.toString(),
        travelPlanId: updatedAccommodation.travelPlanId.toString(),
        name: updatedAccommodation.name,
        address: updatedAccommodation.address,
        latitude: updatedAccommodation.latitude,
        longitude: updatedAccommodation.longitude,
        placeId: updatedAccommodation.placeId,
        checkInDate: updatedAccommodation.checkInDate,
        checkInTime: updatedAccommodation.checkInTime,
        checkOutDate: updatedAccommodation.checkOutDate,
        checkOutTime: updatedAccommodation.checkOutTime,
        confirmationNumber: updatedAccommodation.confirmationNumber,
        price: updatedAccommodation.price,
        currency: updatedAccommodation.currency,
        isConfirmed: updatedAccommodation.isConfirmed,
        isSelected: updatedAccommodation.isSelected,
        phoneNumber: updatedAccommodation.phoneNumber,
        email: updatedAccommodation.email,
        bookingUrl: updatedAccommodation.bookingUrl,
        memo: updatedAccommodation.memo,
        createdBy: updatedAccommodation.createdBy,
        createdAt: updatedAccommodation.createdAt,
        updatedAt: updatedAccommodation.updatedAt,
      };
    } catch (error) {
      console.error('Failed to update accommodation:', error);
      throw error;
    }
  };

  const deleteAccommodation = async (accommodationId: string): Promise<void> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await travelPlanApi.deleteAccommodation(parseInt(accommodationId));
    } catch (error) {
      console.error('Failed to delete accommodation:', error);
      throw error;
    }
  };

  return {
    getAccommodationsByPlan,
    createAccommodation,
    updateAccommodation,
    deleteAccommodation,
  };
};

