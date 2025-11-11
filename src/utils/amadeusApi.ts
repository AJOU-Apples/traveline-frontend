import Constants from 'expo-constants';

// app.config.js의 extra 필드에서 Amadeus API 설정을 읽어옵니다
const getAmadeusConfig = () => {
    // Constants.expoConfig.extra를 통해 설정에 접근
    const extra = Constants.expoConfig?.extra;

    if (!extra?.amadeus) {
        console.warn('Amadeus 설정이 없습니다. app.config.js의 extra.amadeus를 확인하세요.');
        return {};
    }

    console.log('Amadeus config loaded:', {
        hasApiKey: !!extra.amadeus.apiKey,
        hasApiSecret: !!extra.amadeus.apiSecret,
        apiKey: extra.amadeus.apiKey?.substring(0, 8) + '...',
    });

    return extra.amadeus;
};

const amadeusConfig = getAmadeusConfig();
const AMADEUS_API_KEY = amadeusConfig.apiKey;
const AMADEUS_API_SECRET = amadeusConfig.apiSecret;
const AMADEUS_API_URL = 'https://test.api.amadeus.com';

interface AmadeusTokenResponse {
    access_token: string;
    expires_in: number;
}

interface FlightStatusResponse {
    data: Array<{
        flightDesignator: {
            carrierCode: string;
            flightNumber: string;
        };
        scheduledDepartureDate: string;
        flightPoints: Array<{
            iataCode: string;
            departure?: {
                timings: Array<{
                    qualifier: string;
                    value: string;
                }>;
            };
            arrival?: {
                timings: Array<{
                    qualifier: string;
                    value: string;
                }>;
            };
        }>;
    }>;
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Amadeus API의 액세스 토큰을 가져옵니다.
 */
async function getAccessToken(): Promise<string> {
    // 캐시된 토큰이 유효한 경우 반환
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    // API 키와 시크릿이 없으면 에러
    if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
        throw new Error('Amadeus API 키가 설정되지 않았습니다. app.json의 extra.amadeus 설정을 확인하세요.');
    }

    const response = await fetch(`${AMADEUS_API_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Amadeus token error - Status:', response.status);
        console.error('Amadeus token error - Response:', errorText);
        throw new Error(`Failed to get Amadeus access token: ${response.status} - ${errorText}`);
    }

    const data: AmadeusTokenResponse = await response.json();
    cachedToken = data.access_token;
    // 만료 시간을 현재 시간 + (expires_in - 60초)로 설정 (여유 시간 확보)
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    console.log('Amadeus access token obtained successfully');
    return cachedToken;
}

export interface FlightInfo {
    airline: string;
    flightNumber: string;
    departureAirport: string;
    departureAirportCode: string;
    arrivalAirport: string;
    arrivalAirportCode: string;
    departureTime: string;
    arrivalTime: string;
}

/**
 * 항공편 상태 정보를 가져옵니다.
 * @param carrierCode 항공사 코드 (예: KE, OZ)
 * @param flightNumber 편명 (예: 101)
 * @param scheduledDepartureDate 출발일 (YYYY-MM-DD)
 */
export async function getFlightStatus(
    carrierCode: string,
    flightNumber: string,
    scheduledDepartureDate: string
): Promise<FlightInfo | null> {
    try {
        const token = await getAccessToken();

        const url = `${AMADEUS_API_URL}/v2/schedule/flights?carrierCode=${carrierCode}&flightNumber=${flightNumber}&scheduledDepartureDate=${scheduledDepartureDate}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch flight status:', response.status, response.statusText);
            return null;
        }

        const data: FlightStatusResponse = await response.json();

        if (!data.data || data.data.length === 0) {
            return null;
        }

        const flight = data.data[0];
        const flightPoints = flight.flightPoints;

        // 출발지 정보 (첫 번째 flightPoint)
        const departurePoint = flightPoints[0];
        const departureCode = departurePoint.iataCode;
        const departureTimings = departurePoint.departure?.timings || [];
        const scheduledDeparture = departureTimings.find(t => t.qualifier === 'STD');

        // 도착지 정보 (마지막 flightPoint)
        const arrivalPoint = flightPoints[flightPoints.length - 1];
        const arrivalCode = arrivalPoint.iataCode;
        const arrivalTimings = arrivalPoint.arrival?.timings || [];
        const scheduledArrival = arrivalTimings.find(t => t.qualifier === 'STA');

        if (!scheduledDeparture || !scheduledArrival) {
            return null;
        }

        // 시간 포맷 변환 (ISO 8601 -> HH:MM)
        const departureTime = formatTime(scheduledDeparture.value);
        const arrivalTime = formatTime(scheduledArrival.value);

        // 공항 이름 매핑 (추가로 확장 가능)
        const airportNames = getAirportName(departureCode, arrivalCode);

        return {
            airline: carrierCode,
            flightNumber: flightNumber,
            departureAirport: airportNames.departure,
            departureAirportCode: departureCode,
            arrivalAirport: airportNames.arrival,
            arrivalAirportCode: arrivalCode,
            departureTime,
            arrivalTime,
        };
    } catch (error) {
        console.error('Error fetching flight status:', error);
        return null;
    }
}

/**
 * ISO 8601 시간 형식을 HH:MM으로 변환합니다.
 */
function formatTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return '';
    }
}

/**
 * 공항 코드를 공항 이름으로 변환합니다.
 * (실제로는 더 많은 공항 정보를 포함해야 함)
 */
function getAirportName(departureCode: string, arrivalCode: string): { departure: string; arrival: string } {
    const airportMap: { [key: string]: string } = {
        'ICN': '인천국제공항',
        'GMP': '김포국제공항',
        'PUS': '김해국제공항',
        'CJU': '제주국제공항',
        'NRT': '나리타국제공항',
        'HND': '하네다공항',
        'KIX': '간사이국제공항',
        'PVG': '푸동국제공항',
        'PEK': '베이징 수도국제공항',
        'HKG': '홍콩국제공항',
        'BKK': '수완나품국제공항',
        'SIN': '창이국제공항',
        'LAX': '로스앤젤레스국제공항',
        'JFK': '존 F. 케네디 국제공항',
        'LHR': '히드로공항',
        'CDG': '샤를 드 골 공항',
        'FRA': '프랑크푸르트공항',
        'SYD': '시드니 킹스포드 스미스 국제공항',
        'MEL': '멜버른공항',
        // 더 많은 공항을 추가할 수 있습니다
    };

    return {
        departure: airportMap[departureCode] || departureCode,
        arrival: airportMap[arrivalCode] || arrivalCode,
    };
}

