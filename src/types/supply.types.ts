export type Supply = {
  id: string;
  travelPlanId: string;
  text: string;
  quantity?: number;
  unit?: string;
  category?: string;
  memo?: string;
  checked: boolean;
  checkedAt?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

