import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authApi } from '../utils/authApi';
import { chatApi } from '../utils/chatApi';
import { getWebSocketUrl } from '../utils/apiConfig';
import type { ChatMessageDto, SendChatMessageRequest, WebSocketChatMessageRequest, WebSocketChatMessageEvent } from '../types/chat.types';

const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
const DEFAULT_RECONNECT_DELAY = 3000; // 3초

export type ChatWebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseChatOptions {
    travelPlanId: string | null | undefined;
    enabled?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    onMessageReceived?: (message: ChatMessageDto) => void;
}

export const useChat = ({
    travelPlanId,
    enabled = true,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
    reconnectDelay = DEFAULT_RECONNECT_DELAY,
    onMessageReceived,
}: UseChatOptions) => {
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [wsStatus, setWsStatus] = useState<ChatWebSocketStatus>('disconnected');
    const [isSending, setIsSending] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const onMessageReceivedRef = useRef(onMessageReceived);
    const messagesRef = useRef<ChatMessageDto[]>([]);
    const isLoadingRef = useRef(false);

    // onMessageReceived 콜백을 항상 최신으로 유지
    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    // messagesRef 업데이트
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // WebSocket 연결
    const connectWebSocket = useCallback(() => {
        if (!travelPlanId || !enabled) {
            return;
        }

        const token = authApi.getAccessToken();
        if (!token) {
            console.warn('No access token available for WebSocket connection');
            setWsStatus('error');
            return;
        }

        // 기존 연결이 있으면 닫기
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        try {
            setWsStatus('connecting');
            const wsUrl = getWebSocketUrl(`/ws/travel-plans/${travelPlanId}`, token);
            console.log('Connecting to Chat WebSocket:', wsUrl);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('Chat WebSocket connected');
                setWsStatus('connected');
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data: WebSocketChatMessageEvent = JSON.parse(event.data);
                    console.log('Chat WebSocket message received:', data);

                    // CHAT_MESSAGE_SENT 이벤트만 처리
                    if (data.type === 'CHAT_MESSAGE_SENT' && data.data) {
                        const message = data.data;

                        // 중복 메시지 방지 (id + createdAt 기반)
                        setMessages(prev => {
                            const existingMessage = prev.find(m =>
                                m.id === message.id &&
                                m.createdAt === message.createdAt
                            );
                            if (existingMessage) {
                                return prev; // 이미 존재하면 추가하지 않음
                            }

                            // 중복 제거 후 추가 (id와 createdAt 조합으로 고유성 보장)
                            const filtered = prev.filter(m =>
                                !(m.id === message.id && m.createdAt === message.createdAt)
                            );
                            const newMessages = [...filtered, message];
                            return newMessages.sort((a, b) =>
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            );
                        });

                        // 콜백 호출
                        if (onMessageReceivedRef.current) {
                            onMessageReceivedRef.current(message);
                        }
                    }
                } catch (error) {
                    console.error('Failed to parse Chat WebSocket message:', error);
                    console.error('Raw message:', event.data);
                }
            };

            ws.onerror = (error) => {
                console.error('Chat WebSocket error:', error);
                setWsStatus('error');
            };

            ws.onclose = (event) => {
                console.log('Chat WebSocket closed:', event.code, event.reason);
                setWsStatus('disconnected');
                wsRef.current = null;

                // 정상적인 종료가 아니고 재연결 시도 횟수가 최대값보다 작으면 재연결 시도
                if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
                    reconnectAttemptsRef.current += 1;
                    console.log(`Attempting to reconnect chat (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, reconnectDelay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    console.error('Max reconnection attempts reached for chat');
                    setWsStatus('error');
                }
            };
        } catch (error) {
            console.error('Failed to create Chat WebSocket connection:', error);
            setWsStatus('error');
        }
    }, [travelPlanId, enabled, maxReconnectAttempts, reconnectDelay]);

    // WebSocket 연결 해제
    const disconnectWebSocket = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Component unmounting');
            wsRef.current = null;
        }

        setWsStatus('disconnected');
    }, []);

    // 앱 상태 변경 감지 (포그라운드/백그라운드)
    const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && travelPlanId && !wsRef.current && enabled) {
            // 앱이 포그라운드로 돌아왔을 때 WebSocket 재연결
            connectWebSocket();
        }
    }, [travelPlanId, enabled, connectWebSocket]);

    // WebSocket 연결/해제 및 앱 상태 모니터링
    useEffect(() => {
        if (travelPlanId && enabled) {
            connectWebSocket();

            // 앱 상태 변경 리스너 등록
            const subscription = AppState.addEventListener('change', handleAppStateChange);

            return () => {
                disconnectWebSocket();
                subscription.remove();
            };
        } else {
            disconnectWebSocket();
        }
    }, [travelPlanId, enabled, connectWebSocket, disconnectWebSocket, handleAppStateChange]);

    // 메시지 목록 로드
    const loadMessages = useCallback(async (page: number = 0) => {
        if (!travelPlanId || isLoadingRef.current) return;

        isLoadingRef.current = true;
        setIsLoading(true);

        try {
            const planIdNum = typeof travelPlanId === 'string' ? parseInt(travelPlanId, 10) : travelPlanId;
            const response = await chatApi.getMessages(planIdNum, page, 50);

            if (page === 0) {
                // 첫 페이지: 기존 메시지 교체 (createdAt 기준 정렬)
                const sortedMessages = [...response.messages].sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                setMessages(sortedMessages);
            } else {
                // 다음 페이지: 기존 메시지 앞에 추가 (과거 메시지) 후 정렬
                setMessages(prev => {
                    const combined = [...response.messages, ...prev];
                    return combined.sort((a, b) =>
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                });
            }

            setHasMore(response.hasNext);
            setCurrentPage(response.currentPage);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    }, [travelPlanId]);

    // 더 많은 메시지 로드 (과거 메시지)
    const loadMoreMessages = useCallback(async () => {
        if (!hasMore || isLoading) return;
        await loadMessages(currentPage + 1);
    }, [hasMore, isLoading, currentPage, loadMessages]);

    // 메시지 전송
    const sendMessage = useCallback(async (message: string) => {
        if (!travelPlanId || !message.trim() || isSending) return;

        const trimmedMessage = message.trim();
        if (trimmedMessage.length > 1000) {
            throw new Error('메시지는 최대 1000자까지 입력할 수 있습니다.');
        }

        setIsSending(true);

        try {
            // REST API로 메시지 전송
            const planIdNum = typeof travelPlanId === 'string' ? parseInt(travelPlanId, 10) : travelPlanId;
            const newMessage = await chatApi.sendMessage(planIdNum, {
                message: trimmedMessage,
            });

            // WebSocket을 통해 수신될 예정이지만, 즉시 UI에 반영하기 위해 추가
            // (중복 방지 로직이 있으므로 안전)
            setMessages(prev => {
                // 중복 체크 (id + createdAt 조합)
                const existing = prev.find(m =>
                    m.id === newMessage.id &&
                    m.createdAt === newMessage.createdAt
                );
                if (existing) return prev;

                // 중복 제거 후 추가
                const filtered = prev.filter(m =>
                    !(m.id === newMessage.id && m.createdAt === newMessage.createdAt)
                );
                const newMessages = [...filtered, newMessage];
                return newMessages.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
            });

            return newMessage;
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        } finally {
            setIsSending(false);
        }
    }, [travelPlanId, isSending]);

    // WebSocket을 통한 메시지 전송 (선택적)
    const sendMessageViaWebSocket = useCallback((message: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket이 연결되지 않았습니다.');
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage.length > 1000) {
            throw new Error('메시지는 최대 1000자까지 입력할 수 있습니다.');
        }

        const payload: WebSocketChatMessageRequest = {
            type: 'CHAT_MESSAGE',
            data: {
                message: trimmedMessage,
            },
        };

        wsRef.current.send(JSON.stringify(payload));
    }, []);

    // 메시지 초기화
    const clearMessages = useCallback(() => {
        setMessages([]);
        setHasMore(true);
        setCurrentPage(0);
    }, []);

    // 수동 재연결
    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        disconnectWebSocket();
        setTimeout(() => {
            connectWebSocket();
        }, 100);
    }, [connectWebSocket, disconnectWebSocket]);

    // 초기 메시지 로드
    useEffect(() => {
        if (travelPlanId && enabled) {
            loadMessages(0);
        }
    }, [travelPlanId, enabled]); // loadMessages는 의도적으로 제외

    return {
        // 상태
        messages,
        isLoading,
        hasMore,
        currentPage,
        wsStatus,
        isSending,
        // 액션
        sendMessage,
        sendMessageViaWebSocket,
        loadMessages,
        loadMoreMessages,
        clearMessages,
        reconnect,
        disconnect: disconnectWebSocket,
    };
};

