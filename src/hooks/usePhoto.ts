import {travelPlanApi} from '../utils/travelPlanApi';
import type {Photo} from '../types/photo.types';
import type {TravelPlan} from '../types/travelPlan.types';
import type {AuthUser} from '../types/user.types';

export const usePhoto = (
    authUser: AuthUser | null,
    travelPlans: TravelPlan[],
    setTravelPlans: React.Dispatch<React.SetStateAction<TravelPlan[]>>
) => {
    const uploadPhotoToPlace = async (
        planId: string,
        dayNumber: number,
        placeId: string,
        photoUri: string,
        visibility: 'PERSONAL' | 'SHARED' = 'SHARED',
        caption?: string
    ): Promise<Photo> => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const uploadedPhoto = await travelPlanApi.uploadPhoto(
                photoUri,
                parseInt(planId),
                dayNumber,
                parseInt(placeId),
                visibility,
                caption
            );
            const newPhoto: Photo = {
                id: uploadedPhoto.id.toString(),
                travelPlanId: uploadedPhoto.travelPlanId.toString(),
                travelDayId: uploadedPhoto.travelDayId?.toString(),
                dayNumber: uploadedPhoto.dayNumber,
                placeId: uploadedPhoto.placeId?.toString(),
                userId: uploadedPhoto.userId.toString(),
                username: uploadedPhoto.username,
                uri: uploadedPhoto.uri,
                thumbnailUri: uploadedPhoto.thumbnailUri,
                filename: uploadedPhoto.filename,
                fileSize: uploadedPhoto.fileSize,
                mimeType: uploadedPhoto.mimeType,
                width: uploadedPhoto.width,
                height: uploadedPhoto.height,
                latitude: uploadedPhoto.latitude,
                longitude: uploadedPhoto.longitude,
                orderIndex: uploadedPhoto.orderIndex,
                timestamp: uploadedPhoto.timestamp,
                uploadedAt: uploadedPhoto.uploadedAt,
                visibility: uploadedPhoto.visibility,
                caption: uploadedPhoto.caption,
                createdAt: uploadedPhoto.createdAt,
                updatedAt: uploadedPhoto.updatedAt,
            };

            setTravelPlans((prev) =>
                prev.map((plan) => {
                    if (plan.id !== planId) return plan;

                    return {
                        ...plan,
                        days: plan.days.map((day) => {
                            if (day.dayNumber !== dayNumber) return day;

                            return {
                                ...day,
                                places: day.places.map((place) => {
                                    if (place.id !== placeId) return place;

                                    return {
                                        ...place,
                                        photos: [...(place.photos || []), newPhoto],
                                    };
                                }),
                            };
                        }),
                    };
                })
            );

            return newPhoto;
        } catch (error) {
            console.error('Failed to upload photo:', error);
            throw error;
        }
    };

    const getPhotosByPlace = async (placeId: string): Promise<Photo[]> => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const photos = await travelPlanApi.getPhotosByPlace(parseInt(placeId));

            const convertedPhotos = photos.map(photo => {
                return {
                    id: photo.id.toString(),
                    travelPlanId: photo.travelPlanId.toString(),
                    travelDayId: photo.travelDayId?.toString(),
                    dayNumber: photo.dayNumber,
                    placeId: photo.placeId?.toString(),
                    userId: photo.userId.toString(),
                    username: photo.username,
                    uri: photo.uri,
                    thumbnailUri: photo.thumbnailUri,
                    filename: photo.filename,
                    fileSize: photo.fileSize,
                    mimeType: photo.mimeType,
                    width: photo.width,
                    height: photo.height,
                    latitude: photo.latitude,
                    longitude: photo.longitude,
                    orderIndex: photo.orderIndex,
                    timestamp: photo.timestamp,
                    uploadedAt: photo.uploadedAt,
                    visibility: photo.visibility,
                    caption: photo.caption,
                    createdAt: photo.createdAt,
                    updatedAt: photo.updatedAt,
                };
            });

            // travelPlans 상태 업데이트 - 해당 place의 photos를 업데이트
            // 기존 place의 다른 속성들(expenses, memos 등)을 보존
            setTravelPlans(prevPlans =>
                prevPlans.map(plan => ({
                    ...plan,
                    days: plan.days.map(day => ({
                        ...day,
                        places: day.places.map(place => {
                            if (place.id === placeId) {
                                return {
                                    ...place,
                                    photos: convertedPhotos,
                                    // 스프레드 연산자로 인해 다른 속성들(expenses, memos 등)이 자동으로 보존됨
                                };
                            }
                            return place;
                        }),
                    })),
                }))
            );

            return convertedPhotos;
        } catch (error) {
            console.error('❌ [UserContext] Failed to get photos:', error);
            throw error;
        }
    };

    const deletePhoto = async (photoId: string) => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            await travelPlanApi.deletePhoto(parseInt(photoId));

            setTravelPlans((prev) =>
                prev.map((plan) => ({
                    ...plan,
                    days: plan.days.map((day) => ({
                        ...day,
                        places: day.places.map((place) => ({
                            ...place,
                            photos: (place.photos || []).filter((photo) => photo.id !== photoId),
                        })),
                    })),
                }))
            );
        } catch (error) {
            console.error('Failed to delete photo:', error);
            throw error;
        }
    };

    const reorderPhotos = async (placeId: string, visibility: 'PERSONAL' | 'SHARED', photoIds: string[]) => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            const updatedPhotos = await travelPlanApi.reorderPhotos(
                parseInt(placeId),
                visibility,
                photoIds.map((id) => parseInt(id))
            );

            // 상태 업데이트 - 해당 visibility의 photos만 업데이트, 다른 visibility는 유지
            setTravelPlans((prev) =>
                prev.map((plan) => ({
                    ...plan,
                    days: plan.days.map((day) => ({
                        ...day,
                        places: day.places.map((place) => {
                            if (place.id === placeId) {
                                // 다른 visibility의 photos는 그대로 유지
                                const otherVisibilityPhotos = place.photos?.filter(
                                    (photo) => photo.visibility !== visibility
                                ) || [];

                                // 업데이트된 photos를 변환
                                const convertedUpdatedPhotos = updatedPhotos.map((photo) => ({
                                    id: photo.id.toString(),
                                    travelPlanId: photo.travelPlanId.toString(),
                                    travelDayId: photo.travelDayId?.toString(),
                                    dayNumber: photo.dayNumber,
                                    placeId: photo.placeId?.toString(),
                                    userId: photo.userId.toString(),
                                    username: photo.username,
                                    uri: photo.uri,
                                    thumbnailUri: photo.thumbnailUri,
                                    filename: photo.filename,
                                    fileSize: photo.fileSize,
                                    mimeType: photo.mimeType,
                                    width: photo.width,
                                    height: photo.height,
                                    latitude: photo.latitude,
                                    longitude: photo.longitude,
                                    orderIndex: photo.orderIndex,
                                    timestamp: photo.timestamp,
                                    uploadedAt: photo.uploadedAt,
                                    visibility: photo.visibility,
                                    caption: photo.caption,
                                    createdAt: photo.createdAt,
                                    updatedAt: photo.updatedAt,
                                }));

                                // 두 배열을 합침
                                return {
                                    ...place,
                                    photos: [...otherVisibilityPhotos, ...convertedUpdatedPhotos],
                                };
                            }
                            return place;
                        }),
                    })),
                }))
            );
        } catch (error) {
            console.error('Failed to reorder photos:', error);
            throw error;
        }
    };

    return {
        uploadPhotoToPlace,
        getPhotosByPlace,
        deletePhoto,
        reorderPhotos,
    };
};

