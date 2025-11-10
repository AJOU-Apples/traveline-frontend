import React, { createContext, useContext, useMemo, useState, PropsWithChildren } from 'react';

export type Trip = {
  id: string;
  destination: string;
  teamName: string;
  image: string;
  startDate: string; // ISO
};

export type Photo = {
  id: string;
  uri: string;
  timestamp: number;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  type: 'personal' | 'shared'; // 개인 or 공동
  timestamp: number;
};

export type Place = {
  id: string;
  name: string;
  address?: string;
  time?: string;
  memo?: string;
  latitude?: number;
  longitude?: number;
  photos?: Photo[];
  expenses?: Expense[];
};

export type TravelDay = {
  id: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  displayDate: string; // "11월 20일(목)"
  places: Place[];
};

export type Flight = {
  id: string;
  travelPlanId: string;
  airline: string; // 항공사 코드 (KE, OZ 등)
  flightNumber: string; // 편명
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  arrivalTime: string; // HH:MM
  departureAirport: string; // 인천 국제 공항
  departureAirportCode: string; // ICN
  arrivalAirport: string; // 나리타 국제 공항
  arrivalAirportCode: string; // NRT
  duration?: string; // 2시간 30분 소요
  bookingReference?: string; // 예약 번호
  likes?: number; // 좋아요 수
};

export type Accommodation = {
  id: string;
  travelPlanId: string;
  name: string; // 숙소명
  address: string; // 주소
  latitude?: number;
  longitude?: number;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  checkInTime?: string; // HH:MM
  checkOutTime?: string; // HH:MM
  bookingReference?: string; // 예약 확인 번호
  phoneNumber?: string;
  website?: string;
  memo?: string;
  likes?: number; // 좋아요 수
};

export type TravelPlan = {
  id: string;
  title: string;
  destination: string;
  startDate: string; // YYYY.MM.DD
  endDate: string; // YYYY.MM.DD
  participants: number;
  days: TravelDay[];
};

type UserContextValue = {
  username: string;
  upcomingTrip?: Trip;
  recentTrips: Trip[];
  popularTrips: Trip[];
  travelPlans: TravelPlan[];
  flights: Flight[];
  accommodations: Accommodation[];
  addTravelPlan: (plan: Omit<TravelPlan, 'id'>) => string;
  getTravelPlan: (id: string) => TravelPlan | undefined;
  updateTravelPlan: (id: string, plan: Partial<TravelPlan>) => void;
  addPlaceToDay: (planId: string, dayNumber: number, place: Omit<Place, 'id'>) => void;
  reorderPlaces: (planId: string, dayNumber: number, fromIndex: number, toIndex: number) => void;
  addPhotoToPlace: (planId: string, dayNumber: number, placeId: string, photoUri: string) => void;
  deletePhotoFromPlace: (planId: string, dayNumber: number, placeId: string, photoId: string) => void;
  // Expense methods
  addExpenseToPlace: (planId: string, dayNumber: number, placeId: string, expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  deleteExpenseFromPlace: (planId: string, dayNumber: number, placeId: string, expenseId: string) => void;
  // Flight methods
  getFlightsByPlan: (planId: string) => Flight[];
  addFlight: (flight: Omit<Flight, 'id'>) => string;
  updateFlight: (id: string, flight: Partial<Flight>) => void;
  deleteFlight: (id: string) => void;
  // Accommodation methods
  getAccommodationsByPlan: (planId: string) => Accommodation[];
  addAccommodation: (accommodation: Omit<Accommodation, 'id'>) => string;
  updateAccommodation: (id: string, accommodation: Partial<Accommodation>) => void;
  deleteAccommodation: (id: string) => void;
};

const defaultTrips: Trip[] = [
  {
    id: 'tokyo',
    destination: '도쿄',
    teamName: 'Team Apples',
    image:
      'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=1200&auto=format&fit=crop&q=60',
    startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'paris',
    destination: '파리',
    teamName: 'Team Apples',
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=60',
    startDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [username] = useState('Team Apples');
  const [trips] = useState<Trip[]>(defaultTrips);
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);

  const upcomingTrip = useMemo(() => trips[0], [trips]);

  const addTravelPlan = (plan: Omit<TravelPlan, 'id'>) => {
    const id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPlan: TravelPlan = {
      ...plan,
      id,
    };
    setTravelPlans((prev) => [...prev, newPlan]);
    return id;
  };

  const getTravelPlan = (id: string) => {
    return travelPlans.find((plan) => plan.id === id);
  };

  const updateTravelPlan = (id: string, updates: Partial<TravelPlan>) => {
    setTravelPlans((prev) =>
      prev.map((plan) => (plan.id === id ? { ...plan, ...updates } : plan))
    );
  };

  const addPlaceToDay = (planId: string, dayNumber: number, place: Omit<Place, 'id'>) => {
    const placeId = `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPlace: Place = {
      ...place,
      id: placeId,
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
  };

  const reorderPlaces = (planId: string, dayNumber: number, fromIndex: number, toIndex: number) => {
    setTravelPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;

        return {
          ...plan,
          days: plan.days.map((day) => {
            if (day.dayNumber !== dayNumber) return day;

            const newPlaces = [...day.places];
            const [movedPlace] = newPlaces.splice(fromIndex, 1);
            newPlaces.splice(toIndex, 0, movedPlace);

            return {
              ...day,
              places: newPlaces,
            };
          }),
        };
      })
    );
  };

  const addPhotoToPlace = (planId: string, dayNumber: number, placeId: string, photoUri: string) => {
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPhoto: Photo = {
      id: photoId,
      uri: photoUri,
      timestamp: Date.now(),
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
              places: day.places.map((place) => {
                if (place.id !== placeId) return place;

                return {
                  ...place,
                  photos: [...(place.photos || []), newPhoto],
                };
              }),
            };
          }),
        };
      })
    );
  };

  const deletePhotoFromPlace = (planId: string, dayNumber: number, placeId: string, photoId: string) => {
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
                  photos: (place.photos || []).filter((photo) => photo.id !== photoId),
                };
              }),
            };
          }),
        };
      })
    );
  };

  // Expense methods
  const addExpenseToPlace = (planId: string, dayNumber: number, placeId: string, expense: Omit<Expense, 'id' | 'timestamp'>) => {
    const expenseId = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExpense: Expense = {
      ...expense,
      id: expenseId,
      timestamp: Date.now(),
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
  };

  const deleteExpenseFromPlace = (planId: string, dayNumber: number, placeId: string, expenseId: string) => {
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
                  expenses: (place.expenses || []).filter((expense) => expense.id !== expenseId),
                };
              }),
            };
          }),
        };
      })
    );
  };

  // Flight methods
  const getFlightsByPlan = (planId: string) => {
    return flights.filter((flight) => flight.travelPlanId === planId);
  };

  const addFlight = (flight: Omit<Flight, 'id'>) => {
    const id = `flight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFlight: Flight = {
      ...flight,
      id,
    };
    setFlights((prev) => [...prev, newFlight]);
    return id;
  };

  const updateFlight = (id: string, updates: Partial<Flight>) => {
    setFlights((prev) => prev.map((flight) => (flight.id === id ? { ...flight, ...updates } : flight)));
  };

  const deleteFlight = (id: string) => {
    setFlights((prev) => prev.filter((flight) => flight.id !== id));
  };

  // Accommodation methods
  const getAccommodationsByPlan = (planId: string) => {
    return accommodations.filter((acc) => acc.travelPlanId === planId);
  };

  const addAccommodation = (accommodation: Omit<Accommodation, 'id'>) => {
    const id = `accommodation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAccommodation: Accommodation = {
      ...accommodation,
      id,
    };
    setAccommodations((prev) => [...prev, newAccommodation]);
    return id;
  };

  const updateAccommodation = (id: string, updates: Partial<Accommodation>) => {
    setAccommodations((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const deleteAccommodation = (id: string) => {
    setAccommodations((prev) => prev.filter((acc) => acc.id !== id));
  };

  const value: UserContextValue = {
    username,
    upcomingTrip,
    recentTrips: trips,
    popularTrips: trips,
    travelPlans,
    flights,
    accommodations,
    addTravelPlan,
    getTravelPlan,
    updateTravelPlan,
    addPlaceToDay,
    reorderPlaces,
    addPhotoToPlace,
    deletePhotoFromPlace,
    addExpenseToPlace,
    deleteExpenseFromPlace,
    getFlightsByPlan,
    addFlight,
    updateFlight,
    deleteFlight,
    getAccommodationsByPlan,
    addAccommodation,
    updateAccommodation,
    deleteAccommodation,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
