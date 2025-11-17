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

