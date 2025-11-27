import { AuthUser } from './user.types';

// 채팅 메시지 DTO
export interface ChatMessageDto {
    id: number;
    travelPlanId: number;
    user: AuthUser;
    message: string;
    createdAt: string; // ISO 8601 형식
    updatedAt: string;
}

// 채팅 메시지 페이징 응답
export interface ChatMessageResponse {
    messages: ChatMessageDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// 채팅 메시지 전송 요청
export interface SendChatMessageRequest {
    message: string; // 최대 1000자
}

// WebSocket 채팅 메시지 전송 요청
export interface WebSocketChatMessageRequest {
    type: 'CHAT_MESSAGE';
    data: {
        message: string;
    };
}

// WebSocket 채팅 메시지 수신 이벤트
export interface WebSocketChatMessageEvent {
    type: 'CHAT_MESSAGE_SENT';
    data: ChatMessageDto;
}

