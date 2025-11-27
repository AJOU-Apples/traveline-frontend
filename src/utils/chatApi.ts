import { authApi } from './authApi';
import { Platform } from 'react-native';
import type { ChatMessageDto, ChatMessageResponse, SendChatMessageRequest } from '../types/chat.types';

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

const API_BASE_URL = getApiBaseUrl();

class ChatApi {
    // 메시지 전송
    async sendMessage(travelPlanId: number, request: SendChatMessageRequest): Promise<ChatMessageDto> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/chat/messages`,
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획에 메시지를 보낼 권한이 없습니다.');
                }
                if (response.status === 400) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || '메시지 전송에 실패했습니다.');
                }
                throw new Error('메시지 전송에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }

    // 메시지 목록 조회 (페이징)
    async getMessages(
        travelPlanId: number,
        page: number = 0,
        size: number = 50
    ): Promise<ChatMessageResponse> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/chat/messages?page=${page}&size=${size}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획의 채팅을 조회할 권한이 없습니다.');
                }
                throw new Error('메시지 목록 조회에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get messages error:', error);
            throw error;
        }
    }

    // 특정 시점 이후 메시지 조회
    async getMessagesAfter(
        travelPlanId: number,
        after: string // ISO 8601 형식의 datetime
    ): Promise<ChatMessageDto[]> {
        try {
            const response = await authApi.authenticatedFetch(
                `${API_BASE_URL}/travel-plans/${travelPlanId}/chat/messages/after?after=${encodeURIComponent(after)}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('이 여행 계획의 채팅을 조회할 권한이 없습니다.');
                }
                throw new Error('메시지 조회에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Get messages after error:', error);
            throw error;
        }
    }
}

export const chatApi = new ChatApi();

