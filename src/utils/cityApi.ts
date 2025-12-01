import { getApiBaseUrl } from './apiConfig';

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

