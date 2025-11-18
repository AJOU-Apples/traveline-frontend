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

