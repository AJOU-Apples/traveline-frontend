import type { TravelPlan } from '../types/travelPlan.types';
import type { TravelPlanDto } from './travelPlanApi';

// 날짜 변환: YYYY.MM.DD -> YYYY-MM-DD (API 요청용)
export const formatDateToApi = (dateStr: string): string => {
  return dateStr.replace(/\./g, '-');
};

// displayDate 생성: YYYY-MM-DD -> "11월 20일(목)"
export const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일(${weekday})`;
};

// 백엔드 DTO를 프론트엔드 타입으로 변환
export const convertTravelPlanFromDto = (dto: TravelPlanDto): TravelPlan => {
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
    // 멤버 정보 추가
    members: dto.members?.map((member, index) => {
      const fallbackKey = member.email || member.username || `index-${index}`;
      const safeId = member.id != null ? member.id.toString() : `pending-${fallbackKey}`;
      const safeUserId = member.userId != null ? member.userId.toString() : `pending-user-${fallbackKey}`;

      return {
        id: safeId,
        userId: safeUserId,
        username: member.username,
        name: member.name, // 실제 사용자 이름
        email: member.email,
        profileImage: member.profileImage,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        invitedAt: member.invitedAt,
        invitedBy: member.invitedBy ? {
          id: member.invitedBy.id != null ? member.invitedBy.id.toString() : `pending-${fallbackKey}`,
          username: member.invitedBy.username,
        } : undefined,
        invitedByName: member.invitedByName,
      };
    }),
    myRole: dto.myRole,
  };
};

