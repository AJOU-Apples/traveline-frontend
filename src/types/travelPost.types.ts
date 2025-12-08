import type { PhotoDto } from '../utils/travelPlanApi';
import type { TravelPlanDto } from '../utils/travelPlanApi';

export type TravelPostVisibility = 'PUBLIC' | 'LINK_ONLY' | 'PRIVATE';
export type ExpenseDisplayType = 'TOTAL_ONLY' | 'DETAIL' | 'NONE';
export type MemoDisplayType = 'MY_MEMO_ONLY' | 'ALL_MEMOS';

export interface TravelPostAuthor {
    id: number;
    username: string;
    name: string;
    profileImageUrl?: string;
}

export interface TravelPost {
    id: number;
    travelPlanId: number;
    author: TravelPostAuthor;
    title: string;
    content?: string;
    coverImageUrl?: string;
    visibility: TravelPostVisibility;
    shareCode?: string;
    expenseDisplayType: ExpenseDisplayType;
    memoDisplayType: MemoDisplayType;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    isHidden?: boolean;
    createdAt: string;
    updatedAt: string;
    photos?: PhotoDto[];
    travelPlan?: TravelPlanDto;
}

export interface TravelPostComment {
    id: number;
    travelPostId: number;
    user: TravelPostAuthor;
    parentCommentId?: number;
    content: string;
    likeCount: number;
    isLiked: boolean;
    isHidden?: boolean;
    replies?: TravelPostComment[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTravelPostRequest {
    travelPlanId: number;
    title: string;
    content?: string;
    coverImageUrl?: string;
    visibility: TravelPostVisibility;
    expenseDisplayType: ExpenseDisplayType;
    memoDisplayType: MemoDisplayType;
    selectedPhotoIds: number[];
}

export interface UpdateTravelPostRequest {
    title?: string;
    content?: string;
    coverImageUrl?: string;
    visibility?: TravelPostVisibility;
    expenseDisplayType?: ExpenseDisplayType;
    memoDisplayType?: MemoDisplayType;
    selectedPhotoIds?: number[];
}

export interface CreateCommentRequest {
    content: string;
    parentCommentId?: number;
}

export interface UpdateCommentRequest {
    content: string;
}

export interface TravelPostListResponse {
    content: TravelPost[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface CommentListResponse {
    content: TravelPostComment[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

// 신고 관련 타입
export type ReportReason =
    | 'SPAM'           // 스팸
    | 'INAPPROPRIATE'  // 부적절한 콘텐츠
    | 'ABUSE'          // 괴롭힘/욕설
    | 'PRIVACY'        // 개인정보 유출
    | 'OTHER';         // 기타

export interface CreateReportRequest {
    reason: ReportReason;
    description?: string; // 상세 설명 (선택)
}

export interface ReportResponse {
    id: number;
    reporterId: number;
    reportedContentType: 'TRAVEL_POST' | 'COMMENT';
    reportedContentId: number;
    reason: ReportReason;
    description?: string;
    status: 'PENDING' | 'PROCESSED' | 'REJECTED';
    createdAt: string;
}

