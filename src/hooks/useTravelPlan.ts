import {useState, useCallback, useEffect} from 'react';
import {travelPlanApi} from '../utils/travelPlanApi';
import {convertTravelPlanFromDto, formatDateToApi} from '../utils/travelPlanUtils';
import type {TravelPlan} from '../types/travelPlan.types';
import type {AuthUser} from '../types/user.types';

// 기본 준비물 템플릿
const DEFAULT_SUPPLIES = [
    {text: '여권 및 여권 사본'},
    {text: '현금 및 해외 결제 카드'},
    {text: '충전기'},
    {text: '멀티 어댑터(돼지코)'},
    {text: '상비약'},
    {text: '칫솔, 치약'},
];

// 기본 체크리스트 템플릿
const DEFAULT_CHECKLIST = [
    {text: '여권 만료일 확인하기'},
    {text: '여행자 보험 가입하기'},
    {text: '수하물 무게 확인하기'},
    {text: '액체 100ml 규정 확인하기'},
];

export const useTravelPlan = (authUser: AuthUser | null) => {
    const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);

    const loadTravelPlans = useCallback(async () => {
        if (!authUser) return;

        try {
            setIsLoadingPlans(true);
            const plans = await travelPlanApi.getMyTravelPlans();
            const convertedPlans = plans.map(convertTravelPlanFromDto);
            setTravelPlans(convertedPlans);
        } catch (error) {
            console.error('Failed to load travel plans:', error);
        } finally {
            setIsLoadingPlans(false);
        }
    }, [authUser]);

    // 로그인 후 여행 계획 불러오기
    useEffect(() => {
        if (authUser) {
            loadTravelPlans();
        } else {
            setTravelPlans([]);
        }
    }, [authUser, loadTravelPlans]);

    const addTravelPlan = async (plan: Omit<TravelPlan, 'id'>): Promise<string> => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        if (!plan.destinationId) {
            throw new Error('목적지 ID가 필요합니다.');
        }

        try {
            // 날짜 형식 변환: YYYY.MM.DD -> YYYY-MM-DD
            const apiData = {
                title: plan.title,
                destinationId: plan.destinationId,
                startDate: formatDateToApi(plan.startDate),
                endDate: formatDateToApi(plan.endDate),
                participants: plan.participants,
            };

            const createdPlan = await travelPlanApi.createTravelPlan(apiData);
            const convertedPlan = convertTravelPlanFromDto(createdPlan);

            // 여행 생성 후 기본 준비물/체크리스트 초기화 (FE에서 직접 생성)
            try {
                // 기본 준비물 생성
                const supplyPromises = DEFAULT_SUPPLIES.map((supply, index) =>
                    travelPlanApi.createSupply(createdPlan.id, {
                        text: supply.text,
                        orderIndex: index,
                    })
                );

                // 기본 체크리스트 생성
                const taskPromises = DEFAULT_CHECKLIST.map((task, index) =>
                    travelPlanApi.createTask(createdPlan.id, {
                        text: task.text,
                        orderIndex: index,
                    })
                );

                await Promise.all([...supplyPromises, ...taskPromises]);
            } catch (initError) {
            }

            setTravelPlans((prev) => [...prev, convertedPlan]);
            return convertedPlan.id;
        } catch (error) {
            console.error('Failed to create travel plan:', error);
            throw error;
        }
    };

    const getTravelPlan = (id: string) => {
        return travelPlans.find((plan) => plan.id === id);
    };

    const updateTravelPlan = async (id: string, updates: Partial<TravelPlan>) => {
        if (!authUser) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            // 날짜 형식 변환
            const apiUpdates: any = {};
            if (updates.title) apiUpdates.title = updates.title;
            if (updates.destinationId) apiUpdates.destinationId = updates.destinationId;
            if (updates.startDate) apiUpdates.startDate = formatDateToApi(updates.startDate);
            if (updates.endDate) apiUpdates.endDate = formatDateToApi(updates.endDate);
            if (updates.participants !== undefined) apiUpdates.participants = updates.participants;

            const updatedPlan = await travelPlanApi.updateTravelPlan(parseInt(id), apiUpdates);
            const convertedPlan = convertTravelPlanFromDto(updatedPlan);

            setTravelPlans((prev) =>
                prev.map((plan) => (plan.id === id ? convertedPlan : plan))
            );
        } catch (error) {
            console.error('Failed to update travel plan:', error);
            throw error;
        }
    };

    return {
        travelPlans,
        setTravelPlans,
        isLoadingPlans,
        loadTravelPlans,
        addTravelPlan,
        getTravelPlan,
        updateTravelPlan,
    };
};

