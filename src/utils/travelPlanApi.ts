import { authApi } from './authApi';
import { CityDto } from './cityApi';
import { getApiBaseUrl, getServerBaseUrl } from './apiConfig';

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
    likes?: number; // 좋아요 개수
    isLiked?: boolean | null; // 현재 사용자가 좋아요 했는지 (null: 로그인 안함)
    likedBy?: number[]; // 좋아요한 멤버 ID 목록
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
    visibility: 'PERSONAL' | 'SHARED'; // 공개 설정
    createdAt: string;
    updatedAt: string;
}

// ============ Full DTO (전체 데이터 조회용) ============
export interface PlaceFullDto extends PlaceDto {
    photos?: PhotoDto[];
    expenses?: ExpenseDto[];
    memos?: MemoDto[];
}

export interface TravelDayFullDto {
    id: number;
    travelPlanId: number;
    dayNumber: number;
    date: string;
    displayDate: string;
    places: PlaceFullDto[];
}

export interface MemberDto {
    id: number;
    travelPlanId: number;
    userId: string;
    username: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    invitedAt: string;
    acceptedAt?: string;
}

export interface DestinationDto {
    id: number;
    name: string;
    isInternational?: boolean;
    latitude?: number;
    longitude?: number;
    currency?: string;
}

export interface TravelPlanFullDto {
    id: number;
    title: string;
    destination: DestinationDto;
    destinationId?: number;
    startDate: string;
    endDate: string;
    days: TravelDayFullDto[];
    members?: MemberDto[];
    flights?: FlightDto[];
    accommodations?: AccommodationDto[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateExpenseRequest {
    travelPlanId: number;
    dayNumber?: number;
    placeId?: number;
    title: string;
    amount: number;
    currency?: string; // default: KRW
    type: 'PERSONAL' | 'SHARED';
    paidById?: number;
    splitWith?: number[]; // SHARED인 경우 정산할 사람들
    memo?: string;
    expenseDate?: string; // YYYY-MM-DD
    expenseTime?: string; // HH:mm
}

export interface UpdateExpenseRequest {
    title?: string;
    amount?: number;
    type?: 'PERSONAL' | 'SHARED';
    paidById?: number;
    splitWith?: number[];
    isSettled?: boolean;
    memo?: string;
    expenseDate?: string;
    expenseTime?: string;
}

export interface CreateMemoRequest {
    placeId: number;
    content: string;
    visibility?: 'PERSONAL' | 'SHARED'; // 공개 설정 (기본값: SHARED)
}

export interface UpdateMemoRequest {
    content?: string;
    visibility?: 'PERSONAL' | 'SHARED'; // 공개 설정
}

export interface ExpenseSummaryDto {
    totalAmount: number;      // 전체 지출 총액
    totalPersonal: number;    // 개인 지출 총액
    totalShared: number;      // 공동 지출 총액
    expenseCount: number;     // 지출 건수
}

// ============ Accommodation DTO ============
export interface AccommodationDto {
    id: number;
    travelPlanId: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string; // Google Place ID
    checkInDate: string; // YYYY-MM-DD
    checkInTime?: string; // HH:mm
    checkOutDate: string; // YYYY-MM-DD
    checkOutTime?: string; // HH:mm
    confirmationNumber?: string;
    price?: number;
    currency?: string;
    isConfirmed?: boolean;
    isSelected?: boolean; // 선택 여부 (여러 개 선택 가능)
    phoneNumber?: string;
    email?: string;
    bookingUrl?: string;
    memo?: string;
    createdBy?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAccommodationRequest {
    travelPlanId: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    checkInDate: string;
    checkInTime?: string;
    checkOutDate: string;
    checkOutTime?: string;
    confirmationNumber?: string;
    price?: number;
    currency?: string;
    isConfirmed?: boolean;
    isSelected?: boolean;
    phoneNumber?: string;
    email?: string;
    bookingUrl?: string;
    memo?: string;
}

export interface UpdateAccommodationRequest {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    checkInDate?: string;
    checkInTime?: string;
    checkOutDate?: string;
    checkOutTime?: string;
    confirmationNumber?: string;
    price?: number;
    currency?: string;
    isConfirmed?: boolean;
    isSelected?: boolean;
    phoneNumber?: string;
    email?: string;
    bookingUrl?: string;
    memo?: string;
}

// ============ Flight DTO ============
export interface FlightSearchRequest {
    carrierCode: string; // 항공사 코드 (예: KE, OZ, JL, NH)
    flightNumber: string; // 편명 (예: 705)
    scheduledDepartureDate: string; // YYYY-MM-DD
}

export interface FlightSearchResponse {
    airline: string;
    flightNumber: string;
    departureAirport: string;
    departureAirportCode: string;
    arrivalAirport: string;
    arrivalAirportCode: string;
    departureTime: string; // HH:mm
    arrivalTime: string; // HH:mm
    scheduledDepartureDate: string; // YYYY-MM-DD
}

export interface FlightDto {
    id: number;
    travelPlanId: number;
    airline: string;
    flightNumber: string;
    departureAirport: string;
    departureAirportCode?: string;
    departureTime: string; // ISO DateTime
    arrivalAirport: string;
    arrivalAirportCode?: string;
    arrivalTime: string; // ISO DateTime
    confirmationNumber?: string;
    seatNumber?: string;
    price?: number;
    currency?: string;
    isConfirmed?: boolean;
    isSelected?: boolean; // 선택 여부 (여러 개 선택 가능)
    cabinClass?: string;
    passengerName?: string;
    bookingUrl?: string;
    memo?: string;
    createdBy?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFlightRequest {
    travelPlanId: number;
    airline: string;
    flightNumber: string;
    departureAirport: string;
    departureAirportCode?: string;
    departureTime: string;
    arrivalAirport: string;
    arrivalAirportCode?: string;
    arrivalTime: string;
    confirmationNumber?: string;
    seatNumber?: string;
    price?: number;
    currency?: string;
    isConfirmed?: boolean;
    isSelected?: boolean;
    cabinClass?: string;
    passengerName?: string;
    bookingUrl?: string;
    memo?: string;
}

export interface UpdateFlightRequest {
    airline?: string;
    flightNumber?: string;
    departureAirport?: string;
    departureAirportCode?: string;
    departureTime?: string;
    arrivalAirport?: string;
    arrivalAirportCode?: string;
    arrivalTime?: string;
    confirmationNumber?: string;
    seatNumber?: string;
    price?: number;
    currency?: string;
    isConfirmed?: boolean;
    isSelected?: boolean;
    cabinClass?: string;
    passengerName?: string;
    bookingUrl?: string;
    memo?: string;
}

// ============ Supply / Task DTO ============
export interface SupplyDto {
    id: number;
    travelPlanId: number;
    text: string;
    quantity?: number;
    unit?: string;
    category?: string;
    memo?: string;
    checked: boolean;
    checkedAt?: string;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface TaskDto {
    id: number;
    travelPlanId: number;
    text: string;
    deadline?: string;
    memo?: string;
    checked: boolean;
    checkedAt?: string;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupplyRequest {
    travelPlanId: number;
    text: string;
    quantity?: number;
    unit?: string;
    category?: string;
    memo?: string;
    orderIndex?: number;
}

export interface CreateTaskRequest {
    travelPlanId: number;
    text: string;
    deadline?: string;
    memo?: string;
    orderIndex?: number;
}

export interface UpdateSupplyRequest {
    text?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    memo?: string;
    checked?: boolean;
    orderIndex?: number;
}

export interface UpdateTaskRequest {
    text?: string;
    deadline?: string;
    memo?: string;
    checked?: boolean;
    orderIndex?: number;
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

export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface MemberDto {
    id: number;
    userId: number;
    username: string;
    name: string; // 실제 사용자 이름
    email: string;
    profileImage?: string;
    role: MemberRole;
    status: InvitationStatus;
    joinedAt?: string;
    invitedAt?: string;
    invitedBy?: {
        id: number;
        username: string;
    };
    invitedByName?: string;
}

export interface TravelPlanInvitationDto {
    id: number;
    travelPlanId: number;
    travelPlanTitle: string;
    role: MemberRole;
    status: InvitationStatus;
    invitedAt: string;
    invitedBy: {
        id: number;
        username: string;
    };
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
    members?: MemberDto[]; // 멤버 목록
    myRole?: MemberRole; // 현재 사용자의 역할
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

// ============ 멤버 관리 요청 타입 ============
export interface InviteMemberRequest {
    email: string;
    role: 'EDITOR' | 'VIEWER'; // OWNER는 초대 불가
}

export interface UpdateMemberRoleRequest {
    role: MemberRole;
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

    // 여행 계획 전체 데이터 조회 (사진, 지출, 메모, 항공권, 숙소 포함)
    // PUBLIC 여행기에서 호출 시 인증 없이도 조회 가능 (travelPostId 필요)
    async getTravelPlanFull(
        planId: number,
        options?: {
            includePhotos?: boolean;
            includeExpenses?: boolean;
            includeMemos?: boolean;
            includeFlights?: boolean;
            includeAccommodations?: boolean;
            travelPostId?: number; // 게스트 모드에서 여행기 조회 시 필요
        }
    ): Promise<TravelPlanFullDto> {
        try {
            const queryParams = new URLSearchParams();
            if (options?.includePhotos !== undefined) {
                queryParams.append('includePhotos', options.includePhotos.toString());
            }
            if (options?.includeExpenses !== undefined) {
                queryParams.append('includeExpenses', options.includeExpenses.toString());
            }
            if (options?.includeMemos !== undefined) {
                queryParams.append('includeMemos', options.includeMemos.toString());
            }
            if (options?.includeFlights !== undefined) {
                queryParams.append('includeFlights', options.includeFlights.toString());
            }
            if (options?.includeAccommodations !== undefined) {
                queryParams.append('includeAccommodations', options.includeAccommodations.toString());
            }
            // 게스트 모드에서 여행기 조회 시 travelPostId 추가
            if (options?.travelPostId !== undefined) {
                queryParams.append('travelPostId', options.travelPostId.toString());
            }

            const queryString = queryParams.toString();
            const url = `${API_BASE_URL}/travel-plans/${planId}/full${queryString ? `?${queryString}` : ''}`;

            // PUBLIC 여행기에서 호출될 수 있으므로 선택적 인증 사용
            const response = await authApi.optionalAuthFetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획에 접근할 권한이 없습니다.');
                }
                throw new Error('여행 계획 전체 데이터를 가져오는데 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get travel plan full error:', error);
            throw error;
        }
    }

    // 여행기에서 여행 계획 복사
    async copyFromTravelPost(
        travelPostId: number,
        startDate: string,
        title?: string
    ): Promise<TravelPlanDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/copy-from-post/${travelPostId}`,
                {
                    method: 'POST',
                    body: JSON.stringify({ startDate, title }),
                }
            );

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행기의 일정을 복사할 권한이 없습니다.');
                }
                if (response.status === 404) {
                    throw new Error('여행기를 찾을 수 없습니다.');
                }
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || '여행 계획 복사에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Copy travel plan from post error:', error);
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

    // ============ Accommodation API ============

    // 숙소 등록
    async createAccommodation(request: CreateAccommodationRequest): Promise<AccommodationDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/accommodations`,
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '숙소 등록에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Create accommodation error:', error);
            throw error;
        }
    }

    // 여행 계획별 숙소 목록 조회
    async getAccommodationsByTravelPlan(travelPlanId: number): Promise<AccommodationDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/accommodations/travel-plan/${travelPlanId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('숙소 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get accommodations error:', error);
            throw error;
        }
    }

    // 숙소 상세 조회
    async getAccommodation(accommodationId: number): Promise<AccommodationDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/accommodations/${accommodationId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('숙소 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get accommodation error:', error);
            throw error;
        }
    }

    // 숙소 수정
    async updateAccommodation(accommodationId: number, request: UpdateAccommodationRequest): Promise<AccommodationDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/accommodations/${accommodationId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '숙소 수정에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Update accommodation error:', error);
            throw error;
        }
    }

    // 숙소 삭제
    async deleteAccommodation(accommodationId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/accommodations/${accommodationId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('숙소 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete accommodation error:', error);
            throw error;
        }
    }

    // ============ Flight API ============

    // 항공편 검색 (Amadeus API)
    async searchFlight(request: FlightSearchRequest): Promise<FlightSearchResponse> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/flights/search`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('항공편 정보를 찾을 수 없습니다. 수동으로 입력해주세요.');
                }
                throw new Error('항공편 검색에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Search flight error:', error);
            throw error;
        }
    }

    // 항공권 등록
    async createFlight(request: CreateFlightRequest): Promise<FlightDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/flights`,
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '항공권 등록에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Create flight error:', error);
            throw error;
        }
    }

    // 여행 계획별 항공권 목록 조회
    async getFlightsByTravelPlan(travelPlanId: number): Promise<FlightDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/flights/travel-plan/${travelPlanId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('항공권 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get flights error:', error);
            throw error;
        }
    }

    // 항공권 상세 조회
    async getFlight(flightId: number): Promise<FlightDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/flights/${flightId}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('항공권 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get flight error:', error);
            throw error;
        }
    }

    // 항공권 수정
    async updateFlight(flightId: number, request: UpdateFlightRequest): Promise<FlightDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/flights/${flightId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '항공권 수정에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Update flight error:', error);
            throw error;
        }
    }

    // 항공권 삭제
    async deleteFlight(flightId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/flights/${flightId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('항공권 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete flight error:', error);
            throw error;
        }
    }

    // ============ Supply API ============

    // 준비물 목록 조회
    async getSuppliesByTravelPlan(travelPlanId: number): Promise<SupplyDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/supplies`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('준비물 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get supplies error:', error);
            throw error;
        }
    }

    // 준비물 생성
    async createSupply(travelPlanId: number, request: Omit<CreateSupplyRequest, 'travelPlanId'>): Promise<SupplyDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/supplies`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        ...request,
                        travelPlanId, // URL 파라미터와 동일한 값을 body에 포함
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '준비물 등록에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Create supply error:', error);
            throw error;
        }
    }

    // 준비물 수정
    async updateSupply(supplyId: number, request: UpdateSupplyRequest): Promise<SupplyDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/supplies/${supplyId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '준비물 수정에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Update supply error:', error);
            throw error;
        }
    }

    // 준비물 삭제
    async deleteSupply(supplyId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/supplies/${supplyId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('준비물 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete supply error:', error);
            throw error;
        }
    }

    // 준비물 순서 변경
    async reorderSupplies(travelPlanId: number, supplyIds: number[]): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/supplies/reorder`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ supplyIds }),
                }
            );

            if (!response.ok) {
                throw new Error('준비물 순서 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('Reorder supplies error:', error);
            throw error;
        }
    }

    // 준비물 기본 템플릿 초기화
    async initializeSupplies(travelPlanId: number): Promise<SupplyDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/supplies/initialize`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '준비물 초기화에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Initialize supplies error:', error);
            throw error;
        }
    }

    // ============ Task API ============

    // 체크리스트 목록 조회
    async getTasksByTravelPlan(travelPlanId: number): Promise<TaskDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/tasks`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('체크리스트 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get tasks error:', error);
            throw error;
        }
    }

    // 체크리스트 생성
    async createTask(travelPlanId: number, request: Omit<CreateTaskRequest, 'travelPlanId'>): Promise<TaskDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/tasks`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        ...request,
                        travelPlanId, // URL 파라미터와 동일한 값을 body에 포함
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '체크리스트 등록에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Create task error:', error);
            throw error;
        }
    }

    // 체크리스트 수정
    async updateTask(taskId: number, request: UpdateTaskRequest): Promise<TaskDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/tasks/${taskId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '체크리스트 수정에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Update task error:', error);
            throw error;
        }
    }

    // 체크리스트 삭제
    async deleteTask(taskId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/tasks/${taskId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('체크리스트 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete task error:', error);
            throw error;
        }
    }

    // 체크리스트 순서 변경
    async reorderTasks(travelPlanId: number, taskIds: number[]): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/tasks/reorder`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ taskIds }),
                }
            );

            if (!response.ok) {
                throw new Error('체크리스트 순서 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('Reorder tasks error:', error);
            throw error;
        }
    }

    // 체크리스트 기본 템플릿 초기화
    async initializeTasks(travelPlanId: number): Promise<TaskDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/tasks/initialize`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '체크리스트 초기화에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Initialize tasks error:', error);
            throw error;
        }
    }

    // ============ 멤버 관리 API ============

    // 멤버 초대
    async inviteMember(travelPlanId: number, request: InviteMemberRequest): Promise<MemberDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/members`,
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '멤버 초대에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Invite member error:', error);
            throw error;
        }
    }

    // 여행 계획의 멤버 목록 조회
    async getMembersByTravelPlan(travelPlanId: number): Promise<MemberDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/members`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('멤버 목록 조회에 실패했습니다.');
            }

            const data = await response.json();

            // 응답이 배열인지 확인
            if (Array.isArray(data)) {
                return data;
            }

            // 응답이 객체로 감싸져 있는 경우 처리
            if (data && typeof data === 'object') {
                // 일반적인 응답 구조 확인
                if (Array.isArray(data.members)) {
                    return data.members;
                }
                if (Array.isArray(data.data)) {
                    return data.data;
                }
                if (Array.isArray(data.content)) {
                    return data.content;
                }
            }

            // 배열이 아니면 빈 배열 반환
            console.warn('API 응답이 배열이 아닙니다:', data);
            return [];
        } catch (error) {
            console.error('Get members error:', error);
            throw error;
        }
    }

    // 나의 초대 목록 조회
    async getMyInvitations(): Promise<TravelPlanInvitationDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/members/invitations`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('초대 목록 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get invitations error:', error);
            throw error;
        }
    }

    // 초대 수락
    async acceptInvitation(memberId: number): Promise<MemberDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/members/${memberId}/accept`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '초대 수락에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Accept invitation error:', error);
            throw error;
        }
    }

    // 초대 거절
    async rejectInvitation(memberId: number): Promise<MemberDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/members/${memberId}/reject`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '초대 거절에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Reject invitation error:', error);
            throw error;
        }
    }

    // 멤버 역할 변경 (OWNER만 가능)
    async updateMemberRole(memberId: number, request: UpdateMemberRoleRequest): Promise<MemberDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/members/${memberId}/role`,
                {
                    method: 'PUT',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '멤버 역할 변경에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Update member role error:', error);
            throw error;
        }
    }

    // 멤버 제거 (OWNER만 가능)
    async removeMember(memberId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/members/${memberId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('멤버 제거에 실패했습니다.');
            }
        } catch (error) {
            console.error('Remove member error:', error);
            throw error;
        }
    }

    // ============ 초대 코드 API ============

    // 초대 코드 조회
    async getInviteCode(travelPlanId: number): Promise<{ code: string; expiresAt: string } | null> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/invite-code`,
                {
                    method: 'GET',
                }
            );

            if (response.status === 404) {
                return null; // 초대 코드가 없음
            }

            if (!response.ok) {
                return null; // 에러 발생 시 null 반환
            }

            return response.json();
        } catch (error) {
            console.error('Get invite code error:', error);
            return null; // 에러 발생 시 null 반환
        }
    }

    // 초대 코드 생성
    async generateInviteCode(travelPlanId: number): Promise<{ code: string; expiresAt: string }> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/invite-code`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '초대 코드 생성에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Generate invite code error:', error);
            throw error;
        }
    }

    // 초대 코드 정보 조회 (비인증)
    async getInviteInfoByCode(code: string): Promise<TravelPlanDto> {
        try {
            // 코드를 대문자로 변환 (대소문자 구분 없이 처리)
            const upperCode = code.toUpperCase();
            const response = await fetch(
                `${API_BASE_URL}/travel-plans/invite/${upperCode}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('초대 코드를 찾을 수 없습니다.');
                }
                if (response.status === 400) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '유효하지 않은 초대 코드입니다.');
                }
                throw new Error('초대 정보 조회에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Get invite info error:', error);
            throw error;
        }
    }

    // 코드로 초대 수락
    async acceptInviteByCode(code: string): Promise<MemberDto> {
        try {
            // 코드를 대문자로 변환 (대소문자 구분 없이 처리)
            const upperCode = code.toUpperCase();
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/invite/accept`,
                {
                    method: 'POST',
                    body: JSON.stringify({ code: upperCode }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '초대 수락에 실패했습니다.');
            }

            return response.json();
        } catch (error) {
            console.error('Accept invite by code error:', error);
            throw error;
        }
    }

    // 초대 코드 무효화
    async revokeInviteCode(travelPlanId: number): Promise<void> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/invite-code`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('초대 코드 무효화에 실패했습니다.');
            }
        } catch (error) {
            console.error('Revoke invite code error:', error);
            throw error;
        }
    }

    // ============ 좋아요 ============

    // Place 좋아요 토글
    async togglePlaceLike(planId: string, placeId: string): Promise<{ isLiked: boolean; likeCount: number; likedBy: number[] }> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${planId}/places/${placeId}/like`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획의 멤버만 좋아요를 누를 수 있습니다.');
                }
                if (response.status === 404) {
                    throw new Error('장소를 찾을 수 없습니다.');
                }
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || '좋아요 처리에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Toggle place like error:', error);
            throw error;
        }
    }

    // Flight 좋아요 토글
    async toggleFlightLike(planId: string, flightId: string): Promise<{ isLiked: boolean; likeCount: number; likedBy: number[] }> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${planId}/flights/${flightId}/like`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획의 멤버만 좋아요를 누를 수 있습니다.');
                }
                if (response.status === 404) {
                    throw new Error('항공편을 찾을 수 없습니다.');
                }
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || '좋아요 처리에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Toggle flight like error:', error);
            throw error;
        }
    }

    // Accommodation 좋아요 토글
    async toggleAccommodationLike(planId: string, accommodationId: string): Promise<{ isLiked: boolean; likeCount: number; likedBy: number[] }> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${planId}/accommodations/${accommodationId}/like`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획의 멤버만 좋아요를 누를 수 있습니다.');
                }
                if (response.status === 404) {
                    throw new Error('숙소를 찾을 수 없습니다.');
                }
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || '좋아요 처리에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Toggle accommodation like error:', error);
            throw error;
        }
    }
}

export const travelPlanApi = new TravelPlanApi();

