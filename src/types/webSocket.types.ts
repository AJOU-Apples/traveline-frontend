// WebSocket 이벤트 타입 정의
export interface TravelPlanEvent {
    type?: string; // 백엔드에서 보낼 수 있는 원본 타입 (예: "PLACE_REORDERED")
    entityType?: 'PLACE' | 'EXPENSE' | 'PHOTO' | 'FLIGHT' | 'ACCOMMODATION' | 'MEMBER' | 'MEMO';
    eventType?: string;
    data?: any;
    planId: string | number; // 백엔드에서 숫자로 보낼 수 있음
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseTravelPlanWebSocketOptions {
    planId: string | null | undefined;
    onEvent?: (event: TravelPlanEvent) => void;
    enabled?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
}
