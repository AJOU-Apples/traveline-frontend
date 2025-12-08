import type { Photo } from './photo.types';
import type { Expense } from './expense.types';
import type { Memo } from './memo.types';
import type { Member, MemberRole } from './member.types';

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
  likes?: number; // 좋아요 개수
  isLiked?: boolean | null; // 현재 사용자가 좋아요 했는지 (null: 로그인 안함)
  likedBy?: number[]; // 좋아요한 멤버 ID 목록
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
  members?: Member[]; // 멤버 목록
  myRole?: MemberRole; // 현재 사용자의 역할
};

