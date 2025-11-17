import { Platform } from 'react-native';

// 플랫폼별 API URL 설정
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

// City DTO 타입 정의
export interface CityDto {
    id: number;
    name: string;
    isInternational: boolean;
    latitude?: number;
    longitude?: number;
}

/**
 * 모든 도시 목록 조회
 */
export const getAllCities = async (): Promise<CityDto[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/cities`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching all cities:', error);
        throw error;
    }
};

/**
 * 국내/해외 구분으로 도시 조회
 * @param isInternational true(해외), false(국내)
 */
export const getCitiesByType = async (isInternational: boolean): Promise<CityDto[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/cities?isInternational=${isInternational}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching ${isInternational ? 'international' : 'domestic'} cities:`, error);
        throw error;
    }
};

/**
 * 국내 도시 목록 조회
 */
export const getDomesticCities = async (): Promise<CityDto[]> => {
    return getCitiesByType(false);
};

/**
 * 해외 도시 목록 조회
 */
export const getInternationalCities = async (): Promise<CityDto[]> => {
    return getCitiesByType(true);
};

