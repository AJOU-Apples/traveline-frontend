import { authApi } from './authApi';
import { Platform } from 'react-native';
import { CityDto } from './cityApi';

// 플랫폼별 API URL 설정
const getApiBaseUrl = () => {
    if (__DEV__) {
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:8080/api';
        } else {
            return 'http://localhost:8080/api';
        }
    } else {
        return 'https://your-production-server.com/api';
    }
};

const getServerBaseUrl = () => {
    if (__DEV__) {
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:8080';
        } else {
            return 'http://localhost:8080';
        }
    } else {
        return 'https://your-production-server.com';
    }
};

const API_BASE_URL = getApiBaseUrl();
const SERVER_BASE_URL = getServerBaseUrl();

// URI를 전체 URL로 변환하는 헬퍼 함수
export const getFullImageUrl = (uri: string | undefined): string => {
    if (!uri) return '';
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri; // 이미 전체 URL
    }
    return `${SERVER_BASE_URL}${uri}`; // 상대 경로를 전체 URL로 변환
};

// ============ 백엔드 응답 타입 정의 ============
export interface PlaceDto {
    id: number;
    travelPlanId: number;
    travelDayId: number;
    dayNumber: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string; // Google Place ID
    time?: string;
    orderIndex?: number;
    memo?: string; // 공유 메모
    personalMemos?: Record<string, string>; // 개인 메모 { userId: memo }
    isVisited?: boolean;
    visitedAt?: string; // ISO DateTime
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number;
}

export interface PhotoDto {
    id: number;
    travelPlanId: number;
    travelDayId?: number;
    dayNumber?: number;
    placeId?: number;
    userId: number;
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
    timestamp?: string; // ISO DateTime
    uploadedAt: string; // ISO DateTime
    // 공개 설정
    visibility: 'PERSONAL' | 'SHARED';
    // 캡션
    caption?: string;
    // 타임스탬프
    createdAt: string;
    updatedAt: string;
}

export interface UpdatePhotoRequest {
    caption?: string;
    visibility?: 'PERSONAL' | 'SHARED';
    placeId?: number;
}

export interface ReorderPhotosRequest {
    placeId: number;
    visibility: 'PERSONAL' | 'SHARED';
    photoIds: number[];
}

export interface ExpenseDto {
    id: number;
    travelPlanId: number;
    travelDayId?: number;
    dayNumber?: number;
    placeId?: number;
    // 결제 정보
    paidById: number;
    paidByName: string;
    // 지출 정보
    title: string;
    amount: number; // 백엔드는 BigDecimal, 프론트는 number
    currency: string;
    // 지출 타입
    type: 'PERSONAL' | 'SHARED';
    // 정산 정보
    splitWith?: number[];
    splitAmount?: number;
    isSettled: boolean;
    // 영수증
    receiptImage?: string;
    // 메모
    memo?: string;
    // 날짜 및 시간
    expenseDate?: string; // YYYY-MM-DD
    expenseTime?: string; // HH:mm
    // 타임스탬프
    createdAt: string;
    updatedAt: string;
}

export interface AuthorDto {
    id: number;
    email: string;
    name: string;
    username: string;
    profileImageUrl?: string;
}

export interface MemoDto {
    id: number;
    placeId: number;
    author: AuthorDto;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExpenseRequest {
    travelPlanId: number;
    dayNumber?: number;
    placeId?: number;
    title: string;
    amount: number;
    currency?: string; // default: KRW
    type: 'PERSONAL' | 'SHARED';
    splitWith?: number[]; // SHARED인 경우 정산할 사람들
    memo?: string;
    expenseDate?: string; // YYYY-MM-DD
    expenseTime?: string; // HH:mm
}

export interface UpdateExpenseRequest {
    title?: string;
    amount?: number;
    type?: 'PERSONAL' | 'SHARED';
    splitWith?: number[];
    isSettled?: boolean;
    memo?: string;
    expenseDate?: string;
    expenseTime?: string;
}

export interface CreateMemoRequest {
    placeId: number;
    content: string;
}

export interface UpdateMemoRequest {
    content: string;
}

export interface ExpenseSummaryDto {
    totalAmount: number;      // 전체 지출 총액
    totalPersonal: number;    // 개인 지출 총액
    totalShared: number;      // 공동 지출 총액
    expenseCount: number;     // 지출 건수
}

export interface PlaceSearchResult {
    name: string;
    address: string;
    placeId: string;
    geometry: {
        location: {
            latitude: number;
            longitude: number;
        };
    };
    types?: string[];
}

export interface RouteInfo {
    distance: number; // meters
    duration: number; // seconds
    polyline: string; // encoded polyline
}

export interface TravelDayDto {
    id: number;
    dayNumber: number;
    date: string; // YYYY-MM-DD
    displayDate: string;
    places?: PlaceDto[]; // Optional: 백엔드에서 places를 포함하지 않을 수 있음
}

export interface TravelPlanDto {
    id: number;
    title: string;
    destination: CityDto;
    startDate: string; // yyyy.MM.dd (백엔드 형식)
    endDate: string; // yyyy.MM.dd (백엔드 형식)
    participants: number;
    isArchived: boolean;
    days: TravelDayDto[];
}

export interface CreateTravelPlanRequest {
    title: string;
    destinationId: number;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    participants: number;
}

export interface UpdateTravelPlanRequest {
    title?: string;
    destinationId?: number;
    startDate?: string;
    endDate?: string;
    participants?: number;
}

export interface CreatePlaceRequest {
    travelPlanId: number;
    dayNumber: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string; // Google Place ID
    time?: string;
    memo?: string; // 공유 메모
}

export interface UpdatePlaceRequest {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    time?: string;
    memo?: string;
    isVisited?: boolean;
}

export interface ReorderPlacesRequest {
    travelPlanId: number;
    dayNumber: number;
    placeIds: number[]; // 새로운 순서대로 장소 ID 배열
}

export interface UpdatePlaceMemoRequest {
    type: 'shared' | 'personal';
    memo: string; // 빈 문자열이면 삭제
}

export interface AddPhotoRequest {
    uri: string;
}

export interface AddExpenseRequest {
    title: string;
    amount: number;
    type: 'PERSONAL' | 'SHARED';
}

// ============ API 클래스 ============
class TravelPlanApi {
    // 여행 계획 목록 조회
    async getMyTravelPlans(status?: string, isArchived?: boolean): Promise<TravelPlanDto[]> {
        try {
            let url = `${API_BASE_URL}/travel-plans/my`;
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (isArchived !== undefined) params.append('isArchived', isArchived.toString());

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            const response = await authApi.authenticatedFetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('여행 계획 목록을 가져오는데 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get my travel plans error:', error);
            throw error;
        }
    }

    // 다가오는 여행 조회 (D-day용)
    async getUpcomingTravel(): Promise<TravelPlanDto | null> {
        try {
            const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-plans/upcoming`, {
                method: 'GET',
            });

            if (response.status === 204) {
                return null; // 다가오는 여행 없음
            }

            if (!response.ok) {
                throw new Error('다가오는 여행을 가져오는데 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get upcoming travel error:', error);
            throw error;
        }
    }

    // 특정 여행 계획 조회
    async getTravelPlan(planId: number): Promise<TravelPlanDto> {
        try {
            const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-plans/${planId}`, {
                method: 'GET',
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획에 접근할 권한이 없습니다.');
                }
                throw new Error('여행 계획을 가져오는데 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get travel plan error:', error);
            throw error;
        }
    }

    // 여행 계획 생성
    async createTravelPlan(data: CreateTravelPlanRequest): Promise<TravelPlanDto> {
        try {
            const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-plans`, {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || '여행 계획 생성에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Create travel plan error:', error);
            throw error;
        }
    }

    // 여행 계획 수정
    async updateTravelPlan(planId: number, data: UpdateTravelPlanRequest): Promise<TravelPlanDto> {
        try {
            const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-plans/${planId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획을 수정할 권한이 없습니다.');
                }
                throw new Error('여행 계획 수정에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Update travel plan error:', error);
            throw error;
        }
    }

    // 여행 계획 삭제
    async deleteTravelPlan(planId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-plans/${planId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획을 삭제할 권한이 없습니다.');
                }
                throw new Error('여행 계획 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete travel plan error:', error);
            throw error;
        }
    }

    // 여행 계획 아카이브
    async archiveTravelPlan(planId: number): Promise<TravelPlanDto> {
        try {
            const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-plans/${planId}/archive`, {
                method: 'POST',
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획을 아카이브할 권한이 없습니다.');
                }
                throw new Error('여행 계획 아카이브에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Archive travel plan error:', error);
            throw error;
        }
    }

    // ============ 장소 관리 ============

    // 장소 추가
    async addPlace(data: CreatePlaceRequest): Promise<PlaceDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/places`,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                throw new Error('장소 추가에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Add place error:', error);
            throw error;
        }
    }

    // 특정 날짜의 장소 목록 조회
    async getPlacesByDay(travelPlanId: number, dayNumber: number): Promise<PlaceDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/places?travelPlanId=${travelPlanId}&dayNumber=${dayNumber}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('장소 목록 조회에 실패했습니다.');
            }

            const data = await response.json();
            return data.places || [];
        } catch (error) {
            console.error('Get places error:', error);
            throw error;
        }
    }

    // 장소 상세 조회
    async getPlace(placeId: number): Promise<PlaceDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/places/${placeId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('장소 조회에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get place error:', error);
            throw error;
        }
    }

    // 장소 수정
    async updatePlace(placeId: number, data: UpdatePlaceRequest): Promise<PlaceDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/places/${placeId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                throw new Error('장소 수정에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Update place error:', error);
            throw error;
        }
    }

    // 장소 삭제
    async deletePlace(placeId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/places/${placeId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('장소 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete place error:', error);
            throw error;
        }
    }

    // 장소 순서 변경
    async reorderPlaces(data: ReorderPlacesRequest): Promise<PlaceDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/places/reorder`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                throw new Error('장소 순서 변경에 실패했습니다.');
            }

            const result = await response.json();
            return result.places || [];
        } catch (error) {
            console.error('Reorder places error:', error);
            throw error;
        }
    }

    // 장소 메모 업데이트
    async updatePlaceMemo(placeId: number, data: UpdatePlaceMemoRequest): Promise<PlaceDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/places/${placeId}/memo`,
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                throw new Error('메모 업데이트에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Update place memo error:', error);
            throw error;
        }
    }

    // 장소 검색 (Google Places API)
    async searchPlaces(query: string, latitude?: number, longitude?: number): Promise<PlaceSearchResult[]> {
        try {
            let url = `${API_BASE_URL}/places/search?query=${encodeURIComponent(query)}`;
            if (latitude !== undefined && longitude !== undefined) {
                url += `&latitude=${latitude}&longitude=${longitude}`;
            }

            const response = await authApi.authenticatedFetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('장소 검색에 실패했습니다.');
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Search places error:', error);
            throw error;
        }
    }

    // 경로 정보 가져오기 (Google Directions API)
    async getRoute(origin: string, destination: string): Promise<RouteInfo | null> {
        try {
            const url = `${API_BASE_URL}/places/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;

            const response = await authApi.authenticatedFetch(url, {
                method: 'GET',
            });

            if (response.status === 204) {
                return null; // No route found
            }

            if (!response.ok) {
                throw new Error('경로 조회에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get route error:', error);
            throw error;
        }
    }

    // ============ 사진 관리 ============

    // 사진 업로드
    async uploadPhoto(
        photoUri: string,
        travelPlanId: number,
        dayNumber?: number,
        placeId?: number,
        visibility: 'PERSONAL' | 'SHARED' = 'SHARED',
        caption?: string
    ): Promise<PhotoDto> {
        try {
            // 원본 파일명 추출 (URI의 마지막 부분)
            const uriParts = photoUri.split('/');
            const originalFilename = uriParts[uriParts.length - 1];

            // 파일 확장자 추출
            const filenameParts = originalFilename.split('.');
            const fileType = filenameParts[filenameParts.length - 1];

            const formData = new FormData();
            // React Native FormData는 특별한 형식이 필요
            formData.append('file', {
                uri: photoUri,
                type: `image/${fileType}`,
                name: originalFilename, // 원본 파일명 유지!
            } as any);

            formData.append('travelPlanId', travelPlanId.toString());
            if (dayNumber !== undefined) formData.append('dayNumber', dayNumber.toString());
            if (placeId !== undefined) formData.append('placeId', placeId.toString());
            formData.append('visibility', visibility);
            if (caption) formData.append('caption', caption);

            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/photos`,
                {
                    method: 'POST',
                    body: formData,
                    // FormData를 보낼 때는 Content-Type을 설정하지 않음 (자동으로 multipart/form-data 설정됨)
                },
                true // FormData를 보낼 때 JSON이 아님을 표시
            );

            if (!response.ok) {
                throw new Error('사진 업로드에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Upload photo error:', error);
            throw error;
        }
    }

    // 장소별 사진 조회
    async getPhotosByPlace(placeId: number): Promise<PhotoDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/photos?placeId=${placeId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('사진 목록 조회에 실패했습니다.');
            }

            const data = await response.json();
            return data.photos || [];
        } catch (error) {
            console.error('Get photos by place error:', error);
            throw error;
        }
    }

    // 날짜별 사진 조회
    async getPhotosByDay(travelPlanId: number, dayNumber: number): Promise<PhotoDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/photos?travelPlanId=${travelPlanId}&dayNumber=${dayNumber}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('사진 목록 조회에 실패했습니다.');
            }

            const data = await response.json();
            return data.photos || [];
        } catch (error) {
            console.error('Get photos by day error:', error);
            throw error;
        }
    }

    // 여행 계획별 사진 조회
    async getPhotosByTravelPlan(travelPlanId: number): Promise<PhotoDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/photos?travelPlanId=${travelPlanId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('사진 목록 조회에 실패했습니다.');
            }

            const data = await response.json();
            return data.photos || [];
        } catch (error) {
            console.error('Get photos by travel plan error:', error);
            throw error;
        }
    }

    // 사진 상세 조회
    async getPhoto(photoId: number): Promise<PhotoDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/photos/${photoId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('사진 조회에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get photo error:', error);
            throw error;
        }
    }

    // 사진 수정
    async updatePhoto(photoId: number, data: UpdatePhotoRequest): Promise<PhotoDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/photos/${photoId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                throw new Error('사진 수정에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Update photo error:', error);
            throw error;
        }
    }

    // 사진 삭제
    async deletePhoto(photoId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/photos/${photoId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('사진 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete photo error:', error);
            throw error;
        }
    }

    // 사진 순서 변경 (visibility별 독립 관리)
    async reorderPhotos(placeId: number, visibility: 'PERSONAL' | 'SHARED', photoIds: number[]): Promise<PhotoDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/photos/reorder`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ placeId, visibility, photoIds }),
                }
            );

            if (!response.ok) {
                throw new Error('사진 순서 변경에 실패했습니다.');
            }

            const data = await response.json();
            return data.photos || data; // { photos: [...] } 또는 [...] 형식 둘 다 지원
        } catch (error) {
            console.error('Reorder photos error:', error);
            throw error;
        }
    }

    // ============ 지출 관리 ============

    // 지출 추가
    async createExpense(request: CreateExpenseRequest): Promise<ExpenseDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/expenses`,
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '지출 추가에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Create expense error:', error);
            throw error;
        }
    }

    // 특정 장소의 지출 조회
    async getExpensesByPlace(placeId: number): Promise<ExpenseDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/expenses?placeId=${placeId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('지출 조회에 실패했습니다.');
            }

            const data = await response.json();
            return data.expenses || [];
        } catch (error) {
            console.error('Get expenses by place error:', error);
            throw error;
        }
    }

    // 특정 날짜의 지출 조회
    async getExpensesByDay(travelPlanId: number, dayNumber: number): Promise<ExpenseDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/expenses?travelPlanId=${travelPlanId}&dayNumber=${dayNumber}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('지출 조회에 실패했습니다.');
            }

            const data = await response.json();
            return data.expenses || [];
        } catch (error) {
            console.error('Get expenses by day error:', error);
            throw error;
        }
    }

    // 여행 계획의 지출 조회 (타입 필터 옵션)
    async getExpensesByTravelPlan(
        travelPlanId: number,
        type?: 'PERSONAL' | 'SHARED'
    ): Promise<{ expenses: ExpenseDto[]; summary: ExpenseSummaryDto }> {
        try {
            const typeParam = type ? `&type=${type}` : '';
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/expenses?travelPlanId=${travelPlanId}${typeParam}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('지출 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get expenses by travel plan error:', error);
            throw error;
        }
    }

    // 지출 상세 조회
    async getExpense(expenseId: number): Promise<ExpenseDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/expenses/${expenseId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('지출 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get expense error:', error);
            throw error;
        }
    }

    // 지출 수정
    async updateExpense(expenseId: number, request: UpdateExpenseRequest): Promise<ExpenseDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/expenses/${expenseId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '지출 수정에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Update expense error:', error);
            throw error;
        }
    }

    // 지출 삭제
    async deleteExpense(expenseId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/expenses/${expenseId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('지출 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete expense error:', error);
            throw error;
        }
    }

    // 지출 통계 조회
    async getExpenseSummary(travelPlanId: number): Promise<ExpenseSummaryDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/expenses/summary?travelPlanId=${travelPlanId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('지출 통계 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get expense summary error:', error);
            throw error;
        }
    }

    // ============ Memo API ============

    // 메모 생성
    async createMemo(request: CreateMemoRequest): Promise<MemoDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/memos`,
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '메모 추가에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Create memo error:', error);
            throw error;
        }
    }

    // 장소별 메모 목록 조회
    async getMemosByPlace(placeId: number): Promise<MemoDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/memos/place/${placeId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('메모 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get memos error:', error);
            throw error;
        }
    }

    // 메모 상세 조회
    async getMemo(memoId: number): Promise<MemoDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/memos/${memoId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('메모 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get memo error:', error);
            throw error;
        }
    }

    // 메모 수정
    async updateMemo(memoId: number, request: UpdateMemoRequest): Promise<MemoDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/memos/${memoId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '메모 수정에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Update memo error:', error);
            throw error;
        }
    }

    // 메모 삭제
    async deleteMemo(memoId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/memos/${memoId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('메모 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete memo error:', error);
            throw error;
        }
    }
}

export const travelPlanApi = new TravelPlanApi();

