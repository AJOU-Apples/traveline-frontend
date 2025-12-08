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
  isLiked?: boolean | null; // 현재 사용자가 좋아요 했는지 (null: 로그인 안함)
  likedBy?: number[]; // 좋아요한 멤버 ID 목록
  phoneNumber?: string;
  email?: string;
  bookingUrl?: string;
  memo?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
};

