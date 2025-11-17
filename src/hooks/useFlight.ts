import { travelPlanApi, type FlightSearchRequest, type FlightSearchResponse } from '../utils/travelPlanApi';
import type { Flight } from '../types/flight.types';
import type { AuthUser } from '../types/user.types';

export const useFlight = (authUser: AuthUser | null) => {
  const searchFlight = async (request: FlightSearchRequest): Promise<FlightSearchResponse> => {
    try {
      return await travelPlanApi.searchFlight(request);
    } catch (error) {
      console.error('Failed to search flight:', error);
      throw error;
    }
  };

  const getFlightsByPlan = async (planId: string): Promise<Flight[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const flights = await travelPlanApi.getFlightsByTravelPlan(parseInt(planId));

      return flights.map((flight) => ({
        id: flight.id.toString(),
        travelPlanId: flight.travelPlanId.toString(),
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        departureAirport: flight.departureAirport,
        departureAirportCode: flight.departureAirportCode,
        departureTime: flight.departureTime,
        arrivalAirport: flight.arrivalAirport,
        arrivalAirportCode: flight.arrivalAirportCode,
        arrivalTime: flight.arrivalTime,
        confirmationNumber: flight.confirmationNumber,
        seatNumber: flight.seatNumber,
        price: flight.price,
        currency: flight.currency,
        isConfirmed: flight.isConfirmed,
        isSelected: flight.isSelected,
        cabinClass: flight.cabinClass,
        passengerName: flight.passengerName,
        bookingUrl: flight.bookingUrl,
        memo: flight.memo,
        createdBy: flight.createdBy,
        createdAt: flight.createdAt,
        updatedAt: flight.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get flights:', error);
      throw error;
    }
  };

  const createFlight = async (planId: string, flight: Omit<Flight, 'id' | 'travelPlanId' | 'createdAt' | 'updatedAt'>): Promise<Flight> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const createdFlight = await travelPlanApi.createFlight({
        travelPlanId: parseInt(planId),
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        departureAirport: flight.departureAirport,
        departureAirportCode: flight.departureAirportCode,
        departureTime: flight.departureTime,
        arrivalAirport: flight.arrivalAirport,
        arrivalAirportCode: flight.arrivalAirportCode,
        arrivalTime: flight.arrivalTime,
        confirmationNumber: flight.confirmationNumber,
        seatNumber: flight.seatNumber,
        price: flight.price,
        currency: flight.currency,
        isConfirmed: flight.isConfirmed,
        isSelected: flight.isSelected,
        cabinClass: flight.cabinClass,
        passengerName: flight.passengerName,
        bookingUrl: flight.bookingUrl,
        memo: flight.memo,
      });

      return {
        id: createdFlight.id.toString(),
        travelPlanId: createdFlight.travelPlanId.toString(),
        airline: createdFlight.airline,
        flightNumber: createdFlight.flightNumber,
        departureAirport: createdFlight.departureAirport,
        departureAirportCode: createdFlight.departureAirportCode,
        departureTime: createdFlight.departureTime,
        arrivalAirport: createdFlight.arrivalAirport,
        arrivalAirportCode: createdFlight.arrivalAirportCode,
        arrivalTime: createdFlight.arrivalTime,
        confirmationNumber: createdFlight.confirmationNumber,
        seatNumber: createdFlight.seatNumber,
        price: createdFlight.price,
        currency: createdFlight.currency,
        isConfirmed: createdFlight.isConfirmed,
        isSelected: createdFlight.isSelected,
        cabinClass: createdFlight.cabinClass,
        passengerName: createdFlight.passengerName,
        bookingUrl: createdFlight.bookingUrl,
        memo: createdFlight.memo,
        createdBy: createdFlight.createdBy,
        createdAt: createdFlight.createdAt,
        updatedAt: createdFlight.updatedAt,
      };
    } catch (error) {
      console.error('Failed to create flight:', error);
      throw error;
    }
  };

  const updateFlight = async (flightId: string, updates: Partial<Flight>): Promise<Flight> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedFlight = await travelPlanApi.updateFlight(parseInt(flightId), {
        airline: updates.airline,
        flightNumber: updates.flightNumber,
        departureAirport: updates.departureAirport,
        departureAirportCode: updates.departureAirportCode,
        departureTime: updates.departureTime,
        arrivalAirport: updates.arrivalAirport,
        arrivalAirportCode: updates.arrivalAirportCode,
        arrivalTime: updates.arrivalTime,
        confirmationNumber: updates.confirmationNumber,
        seatNumber: updates.seatNumber,
        price: updates.price,
        currency: updates.currency,
        isConfirmed: updates.isConfirmed,
        isSelected: updates.isSelected,
        cabinClass: updates.cabinClass,
        passengerName: updates.passengerName,
        bookingUrl: updates.bookingUrl,
        memo: updates.memo,
      });

      return {
        id: updatedFlight.id.toString(),
        travelPlanId: updatedFlight.travelPlanId.toString(),
        airline: updatedFlight.airline,
        flightNumber: updatedFlight.flightNumber,
        departureAirport: updatedFlight.departureAirport,
        departureAirportCode: updatedFlight.departureAirportCode,
        departureTime: updatedFlight.departureTime,
        arrivalAirport: updatedFlight.arrivalAirport,
        arrivalAirportCode: updatedFlight.arrivalAirportCode,
        arrivalTime: updatedFlight.arrivalTime,
        confirmationNumber: updatedFlight.confirmationNumber,
        seatNumber: updatedFlight.seatNumber,
        price: updatedFlight.price,
        currency: updatedFlight.currency,
        isConfirmed: updatedFlight.isConfirmed,
        isSelected: updatedFlight.isSelected,
        cabinClass: updatedFlight.cabinClass,
        passengerName: updatedFlight.passengerName,
        bookingUrl: updatedFlight.bookingUrl,
        memo: updatedFlight.memo,
        createdBy: updatedFlight.createdBy,
        createdAt: updatedFlight.createdAt,
        updatedAt: updatedFlight.updatedAt,
      };
    } catch (error) {
      console.error('Failed to update flight:', error);
      throw error;
    }
  };

  const deleteFlight = async (flightId: string): Promise<void> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await travelPlanApi.deleteFlight(parseInt(flightId));
    } catch (error) {
      console.error('Failed to delete flight:', error);
      throw error;
    }
  };

  return {
    searchFlight,
    getFlightsByPlan,
    createFlight,
    updateFlight,
    deleteFlight,
  };
};

