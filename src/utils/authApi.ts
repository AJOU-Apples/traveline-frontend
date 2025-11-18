import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

// 플랫폼별 API URL 설정
// - iOS 시뮬레이터: localhost
// - Android 에뮬레이터: 10.0.2.2 (에뮬레이터의 호스트 머신을 가리킴)
// - 실제 디바이스: 컴퓨터의 실제 IP 주소 (예: 192.168.0.10)
const getApiBaseUrl = () => {
    if (__DEV__) {
        // 개발 모드
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:8080/api'; // Android 에뮬레이터
        } else {
            return 'http://localhost:8080/api'; // iOS 시뮬레이터
        }
    } else {
        // 프로덕션 모드 - 실제 서버 URL로 변경 필요
        return 'https://your-production-server.com/api';
    }
};

const API_BASE_URL = getApiBaseUrl();

// JWT 토큰 만료 임박 기간 (7일)
const TOKEN_REFRESH_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7일을 밀리초로

// JWT 디코딩 함수
const decodeJWT = (token: string): any => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        // Base64 URL 디코딩
        const payload = parts[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
};

// JWT 토큰 만료 체크 함수
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) {
            return true;
        }

        const expirationTime = decoded.exp * 1000; // JWT exp는 초 단위이므로 밀리초로 변환
        const currentTime = Date.now();

        return currentTime >= expirationTime;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
};

// JWT 토큰 만료 임박 체크 함수 (7일 이내 만료)
const isTokenExpiringSoon = (token: string): boolean => {
    try {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) {
            return false;
        }

        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        // 만료까지 남은 시간이 임계값보다 작으면 true
        return timeUntilExpiration > 0 && timeUntilExpiration < TOKEN_REFRESH_THRESHOLD;
    } catch (error) {
        console.error('Error checking token expiration soon:', error);
        return false;
    }
};

export interface RegisterRequest {
    email: string;
    name: string;
    username: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        name: string;
        username: string;
        profileImageUrl?: string;
    };
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

class AuthApi {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    // 토큰 초기화 (앱 시작시 호출)
    async initializeTokens() {
        try {
            this.accessToken = await AsyncStorage.getItem('accessToken');
            this.refreshToken = await AsyncStorage.getItem('refreshToken');
        } catch (error) {
            console.error('Failed to load tokens:', error);
        }
    }

    // 토큰 유효성 체크 및 자동 갱신
    // 반환값: true = 유효함, false = 만료됨 (로그아웃 필요)
    async checkAndRefreshToken(): Promise<boolean> {
        try {
            if (!this.accessToken) {
                return false;
            }

            // 토큰이 이미 만료되었는지 체크
            if (isTokenExpired(this.accessToken)) {
                // Refresh 토큰으로 갱신 시도
                try {
                    await this.refreshAccessToken();
                    return true;
                } catch (error) {
                    console.error('Failed to refresh expired token:', error);
                    return false;
                }
            }

            // 토큰이 곧 만료될 예정인지 체크 (7일 이내)
            if (isTokenExpiringSoon(this.accessToken)) {
                // 백그라운드에서 갱신 (실패해도 현재 토큰은 유효하므로 true 반환)
                try {
                    await this.refreshAccessToken();
                } catch (error) {
                    console.error('Failed to refresh expiring token:', error);
                }
            }

            return true;
        } catch (error) {
            console.error('Error in checkAndRefreshToken:', error);
            return false;
        }
    }

    // 토큰 저장
    private async saveTokens(accessToken: string, refreshToken: string) {
        if (!accessToken || !refreshToken) {
            throw new Error('토큰 정보가 올바르지 않습니다.');
        }
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        try {
            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
        } catch (error) {
            console.error('Failed to save tokens:', error);
            throw error;
        }
    }

    // 토큰 삭제
    private async clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        try {
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('userData');
        } catch (error) {
            console.error('Failed to clear tokens:', error);
        }
    }

    // 사용자 데이터 저장
    private async saveUserData(user: any) {
        if (!user) {
            throw new Error('사용자 정보가 올바르지 않습니다.');
        }
        try {
            await AsyncStorage.setItem('userData', JSON.stringify(user));
        } catch (error) {
            console.error('Failed to save user data:', error);
            throw error;
        }
    }

    // 사용자 데이터 불러오기
    async getUserData() {
        try {
            const userData = await AsyncStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Failed to load user data:', error);
            return null;
        }
    }

    // 회원가입
    async register(data: RegisterRequest): Promise<LoginResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || '회원가입에 실패했습니다.');
            }

            const result: LoginResponse = await response.json();

            // 응답 검증
            if (!result.accessToken || !result.refreshToken || !result.user) {
                throw new Error('서버 응답이 올바르지 않습니다.');
            }

            await this.saveTokens(result.accessToken, result.refreshToken);
            await this.saveUserData(result.user);
            return result;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    // 로그인
    async login(data: LoginRequest): Promise<LoginResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || '로그인에 실패했습니다.');
            }

            const result: LoginResponse = await response.json();

            // 응답 검증
            if (!result.accessToken || !result.refreshToken || !result.user) {
                throw new Error('서버 응답이 올바르지 않습니다.');
            }

            await this.saveTokens(result.accessToken, result.refreshToken);
            await this.saveUserData(result.user);
            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // 로그아웃
    async logout(): Promise<void> {
        try {
            if (this.accessToken) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            await this.clearTokens();
        }
    }

    // 토큰 갱신
    async refreshAccessToken(): Promise<string> {
        try {
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({refreshToken: this.refreshToken}),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const result = await response.json();
            await this.saveTokens(result.accessToken, result.refreshToken);
            return result.accessToken;
        } catch (error) {
            console.error('Token refresh error:', error);
            await this.clearTokens();
            throw error;
        }
    }

    // 인증된 API 호출
    async authenticatedFetch(url: string, options: RequestInit = {}, isFormData: boolean = false): Promise<Response> {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        const headers: Record<string, string> = {
            ...options.headers as Record<string, string>,
            'Authorization': `Bearer ${this.accessToken}`,
        };

        // FormData가 아닐 때만 Content-Type을 설정 (FormData는 브라우저가 자동 설정)
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        let response = await fetch(url, {...options, headers});

        // 토큰이 만료되었으면 갱신 후 재시도
        if (response.status === 401) {
            try {
                await this.refreshAccessToken();
                headers.Authorization = `Bearer ${this.accessToken}`;
                response = await fetch(url, {...options, headers});
            } catch (error) {
                await this.clearTokens();
                throw error;
            }
        }

        return response;
    }

    // 로그인 상태 확인
    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    // 액세스 토큰 가져오기
    getAccessToken(): string | null {
        return this.accessToken;
    }
}

export const authApi = new AuthApi();

