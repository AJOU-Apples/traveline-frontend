import React, { createContext, useContext, useMemo, useState, PropsWithChildren } from 'react';

export type Trip = {
  id: string;
  destination: string;
  teamName: string;
  image: string;
  startDate: string; // ISO
};

export type Place = {
  id: string;
  name: string;
  address?: string;
  time?: string;
  memo?: string;
  latitude?: number;
  longitude?: number;
};

export type TravelDay = {
  id: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  displayDate: string; // "11월 20일(목)"
  places: Place[];
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
  addTravelPlan: (plan: Omit<TravelPlan, 'id'>) => string;
  getTravelPlan: (id: string) => TravelPlan | undefined;
  updateTravelPlan: (id: string, plan: Partial<TravelPlan>) => void;
  addPlaceToDay: (planId: string, dayNumber: number, place: Omit<Place, 'id'>) => void;
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

  const value: UserContextValue = {
    username,
    upcomingTrip,
    recentTrips: trips,
    popularTrips: trips,
    travelPlans,
    addTravelPlan,
    getTravelPlan,
    updateTravelPlan,
    addPlaceToDay,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
