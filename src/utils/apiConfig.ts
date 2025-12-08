import {Platform} from 'react-native';

/**
 * 플랫폼별 백엔드 API Base URL을 반환합니다.
 * - iOS 시뮬레이터: localhost
 * - Android 에뮬레이터: 10.0.2.2 (에뮬레이터의 호스트 머신을 가리킴)
 * - 실제 디바이스: 컴퓨터의 실제 IP 주소 필요
 * - 프로덕션: 실제 서버 URL
 */
export const getApiBaseUrl = (): string => {
    if (__DEV__) {
        // 개발 모드
        if (Platform.OS === 'android') {
            // return 'http://10.0.2.2:8080/api'; // Android 에뮬레이터
            return 'https://aae04f6d0f8e.ngrok-free.app/api';
        } else {
            // return 'http://localhost:8080/api'; // iOS 시뮬레이터
            return 'https://aae04f6d0f8e.ngrok-free.app/api';
        }
    } else {
        // 프로덕션 모드 - 실제 서버 URL로 변경 필요
        return 'https://your-production-server.com/api';
    }
};

/**
 * 플랫폼별 백엔드 서버 Base URL을 반환합니다 (이미지 등 정적 리소스용).
 * API Base URL과 동일하지만 /api 경로가 없습니다.
 */
export const getServerBaseUrl = (): string => {
    if (__DEV__) {
        // 개발 모드
        if (Platform.OS === 'android') {
            // return 'http://10.0.2.2:8080'; // Android 에뮬레이터
            return 'https://aae04f6d0f8e.ngrok-free.app';
        } else {
            // return 'http://localhost:8080'; // iOS 시뮬레이터
            return 'https://aae04f6d0f8e.ngrok-free.app';
        }
    } else {
        // 프로덕션 모드 - 실제 서버 URL로 변경 필요
        return 'https://your-production-server.com';
    }
};

/**
 * WebSocket URL을 반환합니다.
 * HTTP/HTTPS URL을 WS/WSS로 변환하고 WebSocket 경로를 추가합니다.
 * @param path WebSocket 경로 (예: '/ws/travel-plans/123')
 * @param token 인증 토큰 (옵션)
 */
export const getWebSocketUrl = (path: string, token?: string): string => {
    const serverBaseUrl = getServerBaseUrl();

    // HTTP/HTTPS를 WS/WSS로 변환
    let wsBaseUrl: string;
    if (serverBaseUrl.startsWith('https://')) {
        wsBaseUrl = serverBaseUrl.replace('https://', 'wss://');
    } else if (serverBaseUrl.startsWith('http://')) {
        wsBaseUrl = serverBaseUrl.replace('http://', 'ws://');
    } else {
        // 프로토콜이 없는 경우 기본값으로 https를 사용
        wsBaseUrl = `wss://${serverBaseUrl}`;
    }

    // WebSocket 경로 추가
    const url = `${wsBaseUrl}${path}`;

    // 토큰이 있으면 쿼리 파라미터로 추가
    if (token) {
        return `${url}?token=${token}`;
    }

    return url;
};

