export type Expense = {
  id: string;
  travelPlanId: string;
  travelDayId?: string;
  dayNumber?: number;
  placeId?: string;
  // 결제 정보
  paidById: string;
  paidByName: string;
  // 지출 정보
  title: string;
  amount: number;
  currency: string;
  // 지출 타입
  type: 'PERSONAL' | 'SHARED';
  // 정산 정보
  splitWith?: string[];
  splitAmount?: number;
  isSettled: boolean;
  // 영수증
  receiptImage?: string;
  // 메모
  memo?: string;
  // 날짜 및 시간
  expenseDate?: string;
  expenseTime?: string;
  // 타임스탬프
  createdAt: string;
  updatedAt: string;
};

