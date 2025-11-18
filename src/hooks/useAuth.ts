import {useState, useEffect, useCallback} from 'react';
import {AppState, AppStateStatus, Alert} from 'react-native';
import {authApi} from '../utils/authApi';
import type {AuthUser} from '../types/user.types';

export const useAuth = (onLogout?: () => void) => {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);

    const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
        // 앱이 포그라운드로 돌아올 때만 체크
        if (nextAppState === 'active' && authUser) {
            // 토큰 초기화 (AsyncStorage에서 다시 로드)
            await authApi.initializeTokens();

            // 토큰 유효성 체크 및 자동 갱신
            const isTokenValid = await authApi.checkAndRefreshToken();

            if (!isTokenValid) {
                // 토큰이 만료되었으면 로그아웃 처리
                await authApi.logout();
                setAuthUser(null);
                onLogout?.();

                // 사용자에게 알림
                Alert.alert(
                    '세션 만료',
                    '오랫동안 사용하지 않아 자동으로 로그아웃되었습니다.\n다시 로그인해주세요.',
                    [{text: '확인', style: 'default'}]
                );
            }
        }
    }, [authUser, onLogout]);

    // 앱 시작 시 저장된 사용자 정보 불러오기 및 토큰 체크
    useEffect(() => {
        loadUserData();
    }, []);

    // 앱이 포그라운드로 돌아올 때 토큰 체크
    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [handleAppStateChange]);

    const loadUserData = async () => {
        try {
            // 먼저 토큰 초기화
            await authApi.initializeTokens();

            // 토큰 유효성 체크 및 자동 갱신
            const isTokenValid = await authApi.checkAndRefreshToken();

            if (!isTokenValid) {
                // 토큰이 만료되었으면 로그아웃 처리
                await authApi.logout();
                setAuthUser(null);
                onLogout?.();

                // UI가 준비된 후 알림 표시 (약간의 지연)
                setTimeout(() => {
                    Alert.alert(
                        '세션 만료',
                        '오랫동안 사용하지 않아 자동으로 로그아웃되었습니다.\n다시 로그인해주세요.',
                        [{text: '확인', style: 'default'}]
                    );
                }, 500);
                return;
            }

            // 토큰이 유효하면 사용자 정보 불러오기
            const userData = await authApi.getUserData();
            if (userData) {
                setAuthUser(userData);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            // 에러 발생 시에도 로그아웃 처리
            await authApi.logout();
            setAuthUser(null);
            onLogout?.();
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
            setAuthUser(null);
            onLogout?.();
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    };

    return {
        authUser,
        setAuthUser,
        logout,
        isAuthenticated: !!authUser,
    };
};

