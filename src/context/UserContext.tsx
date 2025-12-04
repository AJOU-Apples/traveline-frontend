import React, {createContext, useContext, useMemo, PropsWithChildren} from 'react';
import {useAuth} from '../hooks/useAuth';
import {useTravelPlan} from '../hooks/useTravelPlan';
import {usePlace} from '../hooks/usePlace';
import {usePhoto} from '../hooks/usePhoto';
import {useExpense} from '../hooks/useExpense';
import {usePlaceMemo} from '../hooks/usePlaceMemo';
import {useFlight} from '../hooks/useFlight';
import {useAccommodation} from '../hooks/useAccommodation';
import {useSupply} from '../hooks/useSupply';
import {useTask} from '../hooks/useTask';
import {useMember} from '../hooks/useMember';
import type {
    Trip,
    AuthUser,
    TravelPlan,
    Place,
    Photo,
    Expense,
    Memo,
    Flight,
    Accommodation,
    Supply,
    Task,
    Member,
    MemberRole,
    TravelPlanInvitation,
} from '../types';
import type {FlightSearchRequest, FlightSearchResponse} from '../utils/travelPlanApi';

export type {
    Trip,
    AuthUser,
    TravelPlan,
    TravelDay,
    Place,
    Photo,
    Expense,
    Memo,
    Author,
    Flight,
    Accommodation,
    Supply,
    Task,
    Member,
    MemberRole,
    InvitationStatus,
    TravelPlanInvitation,
} from '../types';

type UserContextValue = {
    username: string;
    authUser: AuthUser | null;
    isAuthenticated: boolean;
    upcomingTrip?: Trip;
    recentTrips: Trip[];
    popularTrips: Trip[];
    travelPlans: TravelPlan[];
    isLoadingPlans: boolean;
    // Auth methods
    setAuthUser: (user: AuthUser | null) => void;
    logout: () => Promise<void>;
    loadTravelPlans: () => Promise<void>;
    // Travel Plan methods
    addTravelPlan: (plan: Omit<TravelPlan, 'id'>) => Promise<string>;
    getTravelPlan: (id: string) => TravelPlan | undefined;
    updateTravelPlan: (id: string, plan: Partial<TravelPlan>) => Promise<void>;
    deleteTravelPlan: (id: string) => Promise<void>;
    // Place methods
    addPlaceToDay: (planId: string, dayNumber: number, place: Omit<Place, 'id'>) => Promise<void>;
    getPlacesByDay: (planId: string, dayNumber: number) => Promise<Place[]>;
    deletePlaceFromDay: (planId: string, dayNumber: number, placeId: string) => Promise<void>;
    reorderPlaces: (planId: string, dayNumber: number, placeIds: string[]) => Promise<void>;
    // Photo methods
    uploadPhotoToPlace: (planId: string, dayNumber: number, placeId: string, photoUri: string, visibility?: 'PERSONAL' | 'SHARED', caption?: string) => Promise<Photo>;
    getPhotosByPlace: (placeId: string) => Promise<Photo[]>;
    deletePhoto: (photoId: string) => Promise<void>;
    reorderPhotos: (placeId: string, visibility: 'PERSONAL' | 'SHARED', photoIds: string[]) => Promise<void>;
    // Memo methods
    updatePlaceMemo: (planId: string, dayNumber: number, placeId: string, memo: string) => Promise<void>;
    // Expense methods
    createExpense: (planId: string, dayNumber: number, placeId: string, expense: {
        title: string;
        amount: number;
        currency?: string;
        type: 'PERSONAL' | 'SHARED';
        paidById?: string;
        splitWith?: string[];
        memo?: string;
        expenseDate?: string;
        expenseTime?: string;
    }) => Promise<Expense>;
    getExpensesByPlace: (placeId: string) => Promise<Expense[]>;
    getExpensesByPlan: (planId: string, type?: 'PERSONAL' | 'SHARED') => Promise<{
        expenses: Expense[];
        summary: { totalAmount: number; totalPersonal: number; totalShared: number; expenseCount: number }
    }>;
    updateExpense: (expenseId: string, updates: {
        title?: string;
        amount?: number;
        type?: 'PERSONAL' | 'SHARED';
        paidById?: string;
        splitWith?: string[];
        isSettled?: boolean;
        memo?: string;
        expenseDate?: string;
        expenseTime?: string;
    }) => Promise<Expense>;
    deleteExpense: (expenseId: string) => Promise<void>;
    // Memo methods (new)
    createMemo: (placeId: string, content: string, visibility?: 'PERSONAL' | 'SHARED') => Promise<Memo>;
    getMemosByPlace: (placeId: string) => Promise<Memo[]>;
    updateMemo: (memoId: string, content?: string, visibility?: 'PERSONAL' | 'SHARED') => Promise<Memo>;
    deleteMemo: (memoId: string) => Promise<void>;
    // Flight search (Amadeus)
    searchFlight: (request: FlightSearchRequest) => Promise<FlightSearchResponse>;
    // Flight methods
    getFlightsByPlan: (planId: string) => Promise<Flight[]>;
    createFlight: (planId: string, flight: Omit<Flight, 'id' | 'travelPlanId' | 'createdAt' | 'updatedAt'>) => Promise<Flight>;
    updateFlight: (flightId: string, updates: Partial<Flight>) => Promise<Flight>;
    deleteFlight: (flightId: string) => Promise<void>;
    // Accommodation methods
    getAccommodationsByPlan: (planId: string) => Promise<Accommodation[]>;
    createAccommodation: (planId: string, accommodation: Omit<Accommodation, 'id' | 'travelPlanId' | 'createdAt' | 'updatedAt'>) => Promise<Accommodation>;
    updateAccommodation: (accommodationId: string, updates: Partial<Accommodation>) => Promise<Accommodation>;
    deleteAccommodation: (accommodationId: string) => Promise<void>;
    // Supply methods
    getSuppliesByPlan: (planId: string) => Promise<Supply[]>;
    createSupply: (planId: string, supply: Omit<Supply, 'id' | 'travelPlanId' | 'createdAt' | 'updatedAt'>) => Promise<Supply>;
    updateSupply: (supplyId: string, updates: Partial<Supply>) => Promise<Supply>;
    deleteSupply: (supplyId: string) => Promise<void>;
    // Task methods
    getTasksByPlan: (planId: string) => Promise<Task[]>;
    createTask: (planId: string, task: Omit<Task, 'id' | 'travelPlanId' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
    deleteTask: (taskId: string) => Promise<void>;
    // Member methods
    inviteMember: (planId: string, email: string, role: 'EDITOR' | 'VIEWER') => Promise<Member>;
    getMembersByPlan: (planId: string) => Promise<Member[]>;
    getMyInvitations: () => Promise<TravelPlanInvitation[]>;
    acceptInvitation: (memberId: string) => Promise<Member>;
    rejectInvitation: (memberId: string) => Promise<Member>;
    updateMemberRole: (memberId: string, role: MemberRole) => Promise<Member>;
    removeMember: (memberId: string) => Promise<void>;
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

export const UserProvider = ({children}: PropsWithChildren) => {
    const [trips] = React.useState<Trip[]>(defaultTrips);

    // 인증 관련 훅
    const {authUser, setAuthUser, logout: authLogout} = useAuth(() => {
        // 로그아웃 시 travelPlans 초기화
        travelPlanHook.setTravelPlans([]);
    });

    // TravelPlan 관련 훅
    const travelPlanHook = useTravelPlan(authUser);
    const {
        travelPlans,
        setTravelPlans,
        isLoadingPlans,
        loadTravelPlans,
        addTravelPlan,
        getTravelPlan,
        updateTravelPlan,
        deleteTravelPlan
    } = travelPlanHook;

    // Place 관련 훅
    const placeHook = usePlace(authUser, travelPlans, setTravelPlans);
    const {addPlaceToDay, getPlacesByDay, deletePlaceFromDay, reorderPlaces, updatePlaceMemo} = placeHook;

    // Photo 관련 훅
    const photoHook = usePhoto(authUser, travelPlans, setTravelPlans);
    const {uploadPhotoToPlace, getPhotosByPlace, deletePhoto, reorderPhotos} = photoHook;

    // Expense 관련 훅
    const expenseHook = useExpense(authUser, travelPlans, setTravelPlans);
    const {createExpense, getExpensesByPlace, getExpensesByPlan, updateExpense, deleteExpense} = expenseHook;

    // Memo 관련 훅
    const memoHook = usePlaceMemo(authUser, travelPlans, setTravelPlans);
    const {createMemo, getMemosByPlace, updateMemo, deleteMemo} = memoHook;

    // Flight 관련 훅
    const flightHook = useFlight(authUser);
    const {searchFlight, getFlightsByPlan, createFlight, updateFlight, deleteFlight} = flightHook;

    // Accommodation 관련 훅
    const accommodationHook = useAccommodation(authUser);
    const {getAccommodationsByPlan, createAccommodation, updateAccommodation, deleteAccommodation} = accommodationHook;

    // Supply 관련 훅
    const supplyHook = useSupply(authUser);
    const {getSuppliesByPlan, createSupply, updateSupply, deleteSupply} = supplyHook;

    // Task 관련 훅
    const taskHook = useTask(authUser);
    const {getTasksByPlan, createTask, updateTask, deleteTask} = taskHook;

    // Member 관련 훅
    const memberHook = useMember(authUser, loadTravelPlans);
    const {
        inviteMember,
        getMembersByPlan,
        getMyInvitations,
        acceptInvitation,
        rejectInvitation,
        updateMemberRole,
        removeMember
    } = memberHook;

    // username: 로그인 상태면 name (이름), 게스트면 "익명의 여행객"
    const username = authUser ? authUser.username : '익명의 여행객';
    const upcomingTrip = useMemo(() => trips[0], [trips]);

    const logout = async () => {
        await authLogout();
        setTravelPlans([]);
    };

    const value: UserContextValue = {
        username,
        authUser,
        isAuthenticated: !!authUser,
        upcomingTrip,
        recentTrips: trips,
        popularTrips: trips,
        travelPlans,
        isLoadingPlans,
        setAuthUser,
        logout,
        loadTravelPlans,
        addTravelPlan,
        getTravelPlan,
        updateTravelPlan,
        deleteTravelPlan,
        addPlaceToDay,
        getPlacesByDay,
        deletePlaceFromDay,
        reorderPlaces,
        uploadPhotoToPlace,
        getPhotosByPlace,
        deletePhoto,
        reorderPhotos,
        updatePlaceMemo,
        createExpense,
        getExpensesByPlace,
        getExpensesByPlan,
        updateExpense,
        deleteExpense,
        createMemo,
        getMemosByPlace,
        updateMemo,
        deleteMemo,
        searchFlight,
        getFlightsByPlan,
        createFlight,
        updateFlight,
        deleteFlight,
        getAccommodationsByPlan,
        createAccommodation,
        updateAccommodation,
        deleteAccommodation,
        getSuppliesByPlan,
        createSupply,
        updateSupply,
        deleteSupply,
        getTasksByPlan,
        createTask,
        updateTask,
        deleteTask,
        inviteMember,
        getMembersByPlan,
        getMyInvitations,
        acceptInvitation,
        rejectInvitation,
        updateMemberRole,
        removeMember,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used within UserProvider');
    return ctx;
};
