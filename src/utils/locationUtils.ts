/**
 * Haversine 공식을 사용하여 두 GPS 좌표 간의 거리를 계산합니다.
 * @param lat1 첫 번째 지점의 위도
 * @param lon1 첫 번째 지점의 경도
 * @param lat2 두 번째 지점의 위도
 * @param lon2 두 번째 지점의 경도
 * @returns 두 지점 간의 거리 (킬로미터)
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // 지구 반지름 (km)
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * 도(degree)를 라디안(radian)으로 변환합니다.
 * @param degrees 도 단위 각도
 * @returns 라디안 단위 각도
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * 사진의 EXIF 데이터에서 GPS 좌표를 추출합니다.
 * @param exif EXIF 데이터 객체
 * @returns GPS 좌표 객체 또는 null
 */
export function extractGPSFromExif(exif: any): { latitude: number; longitude: number } | null {
    if (!exif) return null;

    // EXIF GPS 데이터 구조는 다양할 수 있습니다
    const { GPSLatitude, GPSLongitude, GPSLatitudeRef, GPSLongitudeRef } = exif;

    if (!GPSLatitude || !GPSLongitude) {
        return null;
    }

    try {
        // GPS 좌표를 십진수 형식으로 변환
        const latitude = convertDMSToDD(GPSLatitude, GPSLatitudeRef);
        const longitude = convertDMSToDD(GPSLongitude, GPSLongitudeRef);

        return { latitude, longitude };
    } catch (error) {
        console.error('GPS 좌표 추출 오류:', error);
        return null;
    }
}

/**
 * DMS(도, 분, 초) 형식을 DD(십진수 도) 형식으로 변환합니다.
 * @param dmsArray [도, 분, 초] 배열
 * @param ref 'N', 'S', 'E', 'W' 중 하나
 * @returns 십진수 도
 */
function convertDMSToDD(dmsArray: number[], ref: string): number {
    const degrees = dmsArray[0];
    const minutes = dmsArray[1];
    const seconds = dmsArray[2];

    let dd = degrees + minutes / 60 + seconds / 3600;

    if (ref === 'S' || ref === 'W') {
        dd = dd * -1;
    }

    return dd;
}

