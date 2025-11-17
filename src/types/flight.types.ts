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

