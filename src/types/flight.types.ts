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
  isLiked?: boolean | null; // 현재 사용자가 좋아요 했는지 (null: 로그인 안함)
  likedBy?: number[]; // 좋아요한 멤버 ID 목록
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

