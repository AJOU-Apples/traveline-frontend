export type Task = {
  id: string;
  travelPlanId: string;
  text: string;
  deadline?: string;
  memo?: string;
  checked: boolean;
  checkedAt?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

