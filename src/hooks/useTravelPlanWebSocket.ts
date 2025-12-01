import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authApi } from '../utils/authApi';
import { getWebSocketUrl } from '../utils/apiConfig';
import type { TravelPlanEvent, WebSocketStatus, UseTravelPlanWebSocketOptions } from '../types/webSocket.types';

const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
const DEFAULT_RECONNECT_DELAY = 3000; // 3초

// 이벤트 타입 정규화 (예: "PLACE_REORDERED" -> { entityType: "PLACE", eventType: "REORDERED" })
const normalizeEventType = (type: string): { entityType: TravelPlanEvent['entityType']; eventType: string } => {
    // "PLACE_REORDERED" -> { entityType: "PLACE", eventType: "REORDERED" }
    const parts = type.split('_');
    if (parts.length >= 2) {
        const entityType = parts[0] as TravelPlanEvent['entityType'];
        return {
            entityType,
            eventType: parts.slice(1).join('_'),
        };
    }

    // 기본값 반환 (예상치 못한 형식)
    return {
        entityType: undefined,
        eventType: type,
    };
};

export const useTravelPlanWebSocket = ({
    planId,
    onEvent,
    enabled = true,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
    reconnectDelay = DEFAULT_RECONNECT_DELAY,
}: UseTravelPlanWebSocketOptions) => {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const statusRef = useRef<WebSocketStatus>('disconnected');
    const onEventRef = useRef(onEvent);

    // onEvent 콜백을 항상 최신으로 유지
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    // WebSocket 연결
    const connectWebSocket = useCallback(() => {
        if (!planId || !enabled) {
            return;
        }

        const token = authApi.getAccessToken();
        if (!token) {
            console.warn('No access token available for WebSocket connection');
            statusRef.current = 'error';
            return;
        }

        // 기존 연결이 있으면 닫기
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        try {
            statusRef.current = 'connecting';
            const wsUrl = getWebSocketUrl(`/ws/travel-plans/${planId}`, token);
            console.log('Connecting to WebSocket:', wsUrl);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                statusRef.current = 'connected';
                reconnectAttemptsRef.current = 0; // 연결 성공 시 재연결 시도 횟수 리셋
            };

            ws.onmessage = (event) => {
                try {
                    console.log('WebSocket message received (raw):', event.data);
                    let data: TravelPlanEvent = JSON.parse(event.data);
                    console.log('WebSocket message parsed (before normalization):', JSON.stringify(data, null, 2));

                    // 백엔드가 type 필드로 "PLACE_REORDERED" 형식을 보낼 경우 정규화
                    if (data.type && !data.entityType && !data.eventType) {
                        const normalized = normalizeEventType(data.type);
                        data = {
                            ...data,
                            entityType: normalized.entityType,
                            eventType: normalized.eventType,
                        };
                        console.log('WebSocket message normalized:', JSON.stringify(data, null, 2));
                    }

                    // planId가 없으면 현재 연결된 planId 사용 (WebSocket은 특정 planId에 연결되므로)
                    if (!data.planId && planId) {
                        data.planId = planId;
                    }

                    // planId를 문자열로 변환 (일관성 유지)
                    if (typeof data.planId === 'number') {
                        data.planId = data.planId.toString();
                    }

                    // 이벤트 핸들러 호출
                    if (onEventRef.current) {
                        onEventRef.current(data);
                    } else {
                        console.warn('No event handler registered for WebSocket event');
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                    console.error('Raw message:', event.data);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                statusRef.current = 'error';
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                statusRef.current = 'disconnected';
                wsRef.current = null;

                // 정상적인 종료가 아니고 재연결 시도 횟수가 최대값보다 작으면 재연결 시도
                if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
                    reconnectAttemptsRef.current += 1;
                    console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, reconnectDelay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    console.error('Max reconnection attempts reached');
                    statusRef.current = 'error';
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            statusRef.current = 'error';
        }
    }, [planId, enabled, maxReconnectAttempts, reconnectDelay]);

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

        statusRef.current = 'disconnected';
    }, []);

    // 앱 상태 변경 감지 (포그라운드/백그라운드)
    const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && planId && !wsRef.current && enabled) {
            // 앱이 포그라운드로 돌아왔을 때 WebSocket 재연결
            connectWebSocket();
        }
    }, [planId, enabled, connectWebSocket]);

    // WebSocket 연결/해제 및 앱 상태 모니터링
    useEffect(() => {
        if (planId && enabled) {
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
    }, [planId, enabled, connectWebSocket, disconnectWebSocket, handleAppStateChange]);

    // 수동 재연결 함수
    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        disconnectWebSocket();
        setTimeout(() => {
            connectWebSocket();
        }, 100);
    }, [connectWebSocket, disconnectWebSocket]);

    return {
        status: statusRef.current,
        reconnect,
        disconnect: disconnectWebSocket,
    };
};
