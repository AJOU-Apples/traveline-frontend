import React, { createContext, useContext, useMemo, useState, PropsWithChildren, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { authApi } from '../utils/authApi';
import { travelPlanApi, TravelPlanDto, type FlightSearchRequest, type FlightSearchResponse } from '../utils/travelPlanApi';

export type Trip = {
  id: string;
  destination: string;
  teamName: string;
  image: string;
  startDate: string; // ISO
};

export type Photo = {
  id: string;
  travelPlanId: string;
  travelDayId?: string;
  dayNumber?: number;
  placeId?: string;
  userId: string;
  username: string;
  // 파일 정보
  uri: string;
  thumbnailUri?: string;
  filename: string;
  fileSize?: number;
  mimeType?: string;
  // 이미지 정보
  width?: number;
  height?: number;
  // 위치 정보
  latitude?: number;
  longitude?: number;
  // 순서
  orderIndex?: number;
  // 메타데이터
  timestamp?: string;
  uploadedAt: string;
  // 공개 설정
  visibility: 'PERSONAL' | 'SHARED';
  // 캡션
  caption?: string;
  // 타임스탬프
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: string;
  travelPlanId: string;
  travelDayId?: string;
  dayNumber?: number;
  placeId?: string;
  // 결제 정보
  paidById: string;
  paidByName: string;
  // 지출 정보
  title: string;
  amount: number;
  currency: string;
  // 지출 타입
  type: 'PERSONAL' | 'SHARED';
  // 정산 정보
  splitWith?: string[];
  splitAmount?: number;
  isSettled: boolean;
  // 영수증
  receiptImage?: string;
  // 메모
  memo?: string;
  // 날짜 및 시간
  expenseDate?: string;
  expenseTime?: string;
  // 타임스탬프
  createdAt: string;
  updatedAt: string;
};

export type Author = {
  id: string;
  email: string;
  name: string;
  username: string;
  profileImageUrl?: string;
};

export type Memo = {
  id: string;
  placeId: string;
  author: Author;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Place = {
  id: string;
  travelPlanId?: string;
  travelDayId?: string;
  dayNumber?: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string; // Google Place ID
  time?: string;
  orderIndex?: number;
  memo?: string; // 공유 메모
  personalMemos?: Record<string, string>; // 개인 메모
  isVisited?: boolean;
  visitedAt?: string;
  photos?: Photo[];
  expenses?: Expense[];
  memos?: Memo[];
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
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureAirportCode?: string;
  departureTime: string; // ISO DateTime
  arrivalAirport: string;
  arrivalAirportCode?: string;
  arrivalTime: string; // ISO DateTime
  departureDate?: string;
  arrivalDate?: string;
  duration?: string;
  likes?: number;
  confirmationNumber?: string;
  seatNumber?: string;
  price?: number;
  currency?: string;
  isConfirmed?: boolean;
  isSelected?: boolean; // 선택 여부
  cabinClass?: string;
  passengerName?: string;
  bookingUrl?: string;
  memo?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
};

export type Accommodation = {
  id: string;
  travelPlanId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  checkInDate: string; // YYYY-MM-DD
  checkInTime?: string;
  checkOutDate: string; // YYYY-MM-DD
  checkOutTime?: string;
  confirmationNumber?: string;
  price?: number;
  currency?: string;
  isConfirmed?: boolean;
  isSelected?: boolean; // 선택 여부
  likes?: number;
  phoneNumber?: string;
  email?: string;
  bookingUrl?: string;
  memo?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
};

export type TravelPlan = {
  id: string;
  title: string;
  destination: string;
  destinationId?: number;
  destinationCity?: {
    id: number;
    name: string;
    isInternational: boolean;
    latitude?: number;
    longitude?: number;
  };
  startDate: string; // YYYY.MM.DD (화면 표시용)
  endDate: string; // YYYY.MM.DD (화면 표시용)
  participants: number;
  days: TravelDay[];
};

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  username: string;
  profileImageUrl?: string;
};

// ============ 유틸리티 함수 ============

// 날짜 변환: YYYY.MM.DD -> YYYY-MM-DD (API 요청용)
const formatDateToApi = (dateStr: string): string => {
  return dateStr.replace(/\./g, '-');
};

// displayDate 생성: YYYY-MM-DD -> "11월 20일(목)"
const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일(${weekday})`;
};

// 백엔드 DTO를 프론트엔드 타입으로 변환
const convertTravelPlanFromDto = (dto: TravelPlanDto): TravelPlan => {
  // 백엔드 날짜 형식: yyyy.MM.dd -> 프론트엔드 형식: YYYY.MM.DD (동일하므로 그대로 사용)
  return {
    id: dto.id.toString(),
    title: dto.title,
    destination: dto.destination.name,
    destinationId: dto.destination.id,
    destinationCity: {
      id: dto.destination.id,
      name: dto.destination.name,
      isInternational: dto.destination.isInternational,
      latitude: dto.destination.latitude,
      longitude: dto.destination.longitude,
    },
    startDate: dto.startDate, // 이미 yyyy.MM.dd 형식
    endDate: dto.endDate, // 이미 yyyy.MM.dd 형식
    participants: dto.participants,
    days: dto.days.map(day => ({
      id: day.id.toString(),
      dayNumber: day.dayNumber,
      date: day.date,
      displayDate: day.displayDate || formatDisplayDate(day.date),
      places: day.places?.map(place => ({
        id: place.id.toString(),
        name: place.name,
        address: place.address,
        time: place.time,
        memo: place.memo,
        latitude: place.latitude,
        longitude: place.longitude,
        // photos와 expenses는 별도 API로 로드됨
        photos: [],
        expenses: [],
      })) || [], // places가 없으면 빈 배열로 처리
    })),
  };
};

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
    splitWith?: string[];
    memo?: string;
    expenseDate?: string;
    expenseTime?: string;
  }) => Promise<Expense>;
  getExpensesByPlace: (placeId: string) => Promise<Expense[]>;
  updateExpense: (expenseId: string, updates: {
    title?: string;
    amount?: number;
    type?: 'PERSONAL' | 'SHARED';
    splitWith?: string[];
    isSettled?: boolean;
    memo?: string;
    expenseDate?: string;
    expenseTime?: string;
  }) => Promise<Expense>;
  deleteExpense: (expenseId: string) => Promise<void>;
  // Memo methods (new)
  createMemo: (placeId: string, content: string) => Promise<Memo>;
  getMemosByPlace: (placeId: string) => Promise<Memo[]>;
  updateMemo: (memoId: string, content: string) => Promise<Memo>;
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
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [trips] = useState<Trip[]>(defaultTrips);
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // username: 로그인 상태면 name (이름), 게스트면 "익명의 여행객"
  const username = authUser ? authUser.username : '익명의 여행객';

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    // 앱이 포그라운드로 돌아올 때만 체크
    if (nextAppState === 'active' && authUser) {
      console.log('App became active, checking token...');

      // 토큰 초기화 (AsyncStorage에서 다시 로드)
      await authApi.initializeTokens();

      // 토큰 유효성 체크 및 자동 갱신
      const isTokenValid = await authApi.checkAndRefreshToken();

      if (!isTokenValid) {
        // 토큰이 만료되었으면 로그아웃 처리
        console.log('Token expired while app was in background, logging out...');
        await authApi.logout();
        setAuthUser(null);
        setTravelPlans([]);

        // 사용자에게 알림
        Alert.alert(
          '세션 만료',
          '오랫동안 사용하지 않아 자동으로 로그아웃되었습니다.\n다시 로그인해주세요.',
          [{ text: '확인', style: 'default' }]
        );
      }
    }
  }, [authUser]);

  // 앱 시작 시 저장된 사용자 정보 불러오기 및 토큰 체크
  useEffect(() => {
    loadUserData();
  }, []);

  // 앱이 포그라운드로 돌아올 때 토큰 체크
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  const loadUserData = async () => {
    try {
      // 먼저 토큰 초기화
      await authApi.initializeTokens();

      // 토큰 유효성 체크 및 자동 갱신
      const isTokenValid = await authApi.checkAndRefreshToken();

      if (!isTokenValid) {
        // 토큰이 만료되었으면 로그아웃 처리
        console.log('Token expired, logging out...');
        await authApi.logout();
        setAuthUser(null);

        // UI가 준비된 후 알림 표시 (약간의 지연)
        setTimeout(() => {
          Alert.alert(
            '세션 만료',
            '오랫동안 사용하지 않아 자동으로 로그아웃되었습니다.\n다시 로그인해주세요.',
            [{ text: '확인', style: 'default' }]
          );
        }, 500);
        return;
      }

      // 토큰이 유효하면 사용자 정보 불러오기
      const userData = await authApi.getUserData();
      if (userData) {
        setAuthUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // 에러 발생 시에도 로그아웃 처리
      await authApi.logout();
      setAuthUser(null);
    }
  };

  const loadTravelPlans = useCallback(async () => {
    if (!authUser) return;

    try {
      setIsLoadingPlans(true);
      const plans = await travelPlanApi.getMyTravelPlans();
      const convertedPlans = plans.map(convertTravelPlanFromDto);
      setTravelPlans(convertedPlans);
    } catch (error) {
      console.error('Failed to load travel plans:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [authUser]);

  // 로그인 후 여행 계획 불러오기
  useEffect(() => {
    if (authUser) {
      loadTravelPlans();
    } else {
      setTravelPlans([]);
    }
  }, [authUser, loadTravelPlans]);

  const logout = async () => {
    try {
      await authApi.logout();
      setAuthUser(null);
      setTravelPlans([]);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const upcomingTrip = useMemo(() => trips[0], [trips]);

  const addTravelPlan = async (plan: Omit<TravelPlan, 'id'>): Promise<string> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    if (!plan.destinationId) {
      throw new Error('목적지 ID가 필요합니다.');
    }

    try {
      // 날짜 형식 변환: YYYY.MM.DD -> YYYY-MM-DD
      const apiData = {
        title: plan.title,
        destinationId: plan.destinationId,
        startDate: formatDateToApi(plan.startDate),
        endDate: formatDateToApi(plan.endDate),
        participants: plan.participants,
      };

      const createdPlan = await travelPlanApi.createTravelPlan(apiData);
      const convertedPlan = convertTravelPlanFromDto(createdPlan);

      setTravelPlans((prev) => [...prev, convertedPlan]);
      return convertedPlan.id;
    } catch (error) {
      console.error('Failed to create travel plan:', error);
      throw error;
    }
  };

  const getTravelPlan = (id: string) => {
    return travelPlans.find((plan) => plan.id === id);
  };

  const updateTravelPlan = async (id: string, updates: Partial<TravelPlan>) => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      // 날짜 형식 변환
      const apiUpdates: any = {};
      if (updates.title) apiUpdates.title = updates.title;
      if (updates.destinationId) apiUpdates.destinationId = updates.destinationId;
      if (updates.startDate) apiUpdates.startDate = formatDateToApi(updates.startDate);
      if (updates.endDate) apiUpdates.endDate = formatDateToApi(updates.endDate);
      if (updates.participants !== undefined) apiUpdates.participants = updates.participants;

      const updatedPlan = await travelPlanApi.updateTravelPlan(parseInt(id), apiUpdates);
      const convertedPlan = convertTravelPlanFromDto(updatedPlan);

      setTravelPlans((prev) =>
        prev.map((plan) => (plan.id === id ? convertedPlan : plan))
      );
    } catch (error) {
      console.error('Failed to update travel plan:', error);
      throw error;
    }
  };

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

  const uploadPhotoToPlace = async (planId: string, dayNumber: number, placeId: string, photoUri: string, visibility: 'PERSONAL' | 'SHARED' = 'SHARED', caption?: string): Promise<Photo> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      console.log('📤 [uploadPhotoToPlace] Starting upload... visibility:', visibility);
      const uploadedPhoto = await travelPlanApi.uploadPhoto(
        photoUri,
        parseInt(planId),
        dayNumber,
        parseInt(placeId),
        visibility,
        caption
      );
      console.log('✅ [uploadPhotoToPlace] Upload successful, photoId:', uploadedPhoto.id);

      const newPhoto: Photo = {
        id: uploadedPhoto.id.toString(),
        travelPlanId: uploadedPhoto.travelPlanId.toString(),
        travelDayId: uploadedPhoto.travelDayId?.toString(),
        dayNumber: uploadedPhoto.dayNumber,
        placeId: uploadedPhoto.placeId?.toString(),
        userId: uploadedPhoto.userId.toString(),
        username: uploadedPhoto.username,
        uri: uploadedPhoto.uri,
        thumbnailUri: uploadedPhoto.thumbnailUri,
        filename: uploadedPhoto.filename,
        fileSize: uploadedPhoto.fileSize,
        mimeType: uploadedPhoto.mimeType,
        width: uploadedPhoto.width,
        height: uploadedPhoto.height,
        latitude: uploadedPhoto.latitude,
        longitude: uploadedPhoto.longitude,
        orderIndex: uploadedPhoto.orderIndex,
        timestamp: uploadedPhoto.timestamp,
        uploadedAt: uploadedPhoto.uploadedAt,
        visibility: uploadedPhoto.visibility,
        caption: uploadedPhoto.caption,
        createdAt: uploadedPhoto.createdAt,
        updatedAt: uploadedPhoto.updatedAt,
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

      return newPhoto;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      throw error;
    }
  };

  const getPhotosByPlace = async (placeId: string): Promise<Photo[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      console.log('🔄 [UserContext] getPhotosByPlace called for placeId:', placeId);
      const photos = await travelPlanApi.getPhotosByPlace(parseInt(placeId));
      console.log('✅ [UserContext] Backend returned photos:', photos?.length || 0);
      console.log('📦 [UserContext] Raw backend response:', JSON.stringify(photos, null, 2));

      const convertedPhotos = photos.map(photo => {
        console.log('🔄 [UserContext] Converting photo:', photo.id, 'uri:', photo.uri);
        return {
          id: photo.id.toString(),
          travelPlanId: photo.travelPlanId.toString(),
          travelDayId: photo.travelDayId?.toString(),
          dayNumber: photo.dayNumber,
          placeId: photo.placeId?.toString(),
          userId: photo.userId.toString(),
          username: photo.username,
          uri: photo.uri,
          thumbnailUri: photo.thumbnailUri,
          filename: photo.filename,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          width: photo.width,
          height: photo.height,
          latitude: photo.latitude,
          longitude: photo.longitude,
          orderIndex: photo.orderIndex,
          timestamp: photo.timestamp,
          uploadedAt: photo.uploadedAt,
          visibility: photo.visibility,
          caption: photo.caption,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt,
        };
      });

      console.log('✅ [UserContext] Converted photos:', convertedPhotos?.length || 0);

      // travelPlans 상태 업데이트 - 해당 place의 photos를 업데이트
      setTravelPlans(prevPlans =>
        prevPlans.map(plan => ({
          ...plan,
          days: plan.days.map(day => ({
            ...day,
            places: day.places.map(place => {
              if (place.id === placeId) {
                console.log('✅ [UserContext] Updating photos for place:', place.id, 'with', convertedPhotos.length, 'photos');
                return {
                  ...place,
                  photos: convertedPhotos,
                };
              }
              return place;
            }),
          })),
        }))
      );

      return convertedPhotos;
    } catch (error) {
      console.error('❌ [UserContext] Failed to get photos:', error);
      throw error;
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await travelPlanApi.deletePhoto(parseInt(photoId));

      setTravelPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          days: plan.days.map((day) => ({
            ...day,
            places: day.places.map((place) => ({
              ...place,
              photos: (place.photos || []).filter((photo) => photo.id !== photoId),
            })),
          })),
        }))
      );
    } catch (error) {
      console.error('Failed to delete photo:', error);
      throw error;
    }
  };

  const reorderPhotos = async (placeId: string, visibility: 'PERSONAL' | 'SHARED', photoIds: string[]) => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedPhotos = await travelPlanApi.reorderPhotos(
        parseInt(placeId),
        visibility,
        photoIds.map((id) => parseInt(id))
      );

      // 상태 업데이트 - 해당 visibility의 photos만 업데이트, 다른 visibility는 유지
      setTravelPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          days: plan.days.map((day) => ({
            ...day,
            places: day.places.map((place) => {
              if (place.id === placeId) {
                // 다른 visibility의 photos는 그대로 유지
                const otherVisibilityPhotos = place.photos?.filter(
                  (photo) => photo.visibility !== visibility
                ) || [];

                // 업데이트된 photos를 변환
                const convertedUpdatedPhotos = updatedPhotos.map((photo) => ({
                  id: photo.id.toString(),
                  travelPlanId: photo.travelPlanId.toString(),
                  travelDayId: photo.travelDayId?.toString(),
                  dayNumber: photo.dayNumber,
                  placeId: photo.placeId?.toString(),
                  userId: photo.userId.toString(),
                  username: photo.username,
                  uri: photo.uri,
                  thumbnailUri: photo.thumbnailUri,
                  filename: photo.filename,
                  fileSize: photo.fileSize,
                  mimeType: photo.mimeType,
                  width: photo.width,
                  height: photo.height,
                  latitude: photo.latitude,
                  longitude: photo.longitude,
                  orderIndex: photo.orderIndex,
                  timestamp: photo.timestamp,
                  uploadedAt: photo.uploadedAt,
                  visibility: photo.visibility,
                  caption: photo.caption,
                  createdAt: photo.createdAt,
                  updatedAt: photo.updatedAt,
                }));

                // 두 배열을 합침
                return {
                  ...place,
                  photos: [...otherVisibilityPhotos, ...convertedUpdatedPhotos],
                };
              }
              return place;
            }),
          })),
        }))
      );
    } catch (error) {
      console.error('Failed to reorder photos:', error);
      throw error;
    }
  };

  // Memo methods
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

  // Expense methods
  const createExpense = async (planId: string, dayNumber: number, placeId: string, expense: {
    title: string;
    amount: number;
    currency?: string;
    type: 'PERSONAL' | 'SHARED';
    splitWith?: string[];
    memo?: string;
    expenseDate?: string;
    expenseTime?: string;
  }): Promise<Expense> => {
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
                  expenses: convertedExpenses,
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

  const updateExpense = async (expenseId: string, updates: {
    title?: string;
    amount?: number;
    type?: 'PERSONAL' | 'SHARED';
    splitWith?: string[];
    isSettled?: boolean;
    memo?: string;
    expenseDate?: string;
    expenseTime?: string;
  }): Promise<Expense> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedExpense = await travelPlanApi.updateExpense(
        parseInt(expenseId),
        {
          ...updates,
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
            places: day.places.map((place) => ({
              ...place,
              expenses: place.expenses?.map((expense) =>
                expense.id === expenseId ? convertedExpense : expense
              ),
            })),
          })),
        }))
      );

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

  // Memo methods
  const createMemo = async (placeId: string, content: string): Promise<Memo> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const createdMemo = await travelPlanApi.createMemo({
        placeId: parseInt(placeId),
        content: content,
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
        createdAt: memo.createdAt,
        updatedAt: memo.updatedAt,
      }));

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
                  memos: convertedMemos,
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

  const updateMemo = async (memoId: string, content: string): Promise<Memo> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedMemo = await travelPlanApi.updateMemo(parseInt(memoId), {
        content: content,
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

  // Flight search (Amadeus)
  const searchFlight = async (request: FlightSearchRequest): Promise<FlightSearchResponse> => {
    try {
      return await travelPlanApi.searchFlight(request);
    } catch (error) {
      console.error('Failed to search flight:', error);
      throw error;
    }
  };

  // Flight methods
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

  // Accommodation methods
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
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
