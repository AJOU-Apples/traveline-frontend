export type AuthUser = {
  id: number;
  email: string;
  name: string;
  username: string;
  profileImageUrl?: string;
};

export type Trip = {
  id: string;
  destination: string;
  teamName: string;
  image: string;
  startDate: string; // ISO
};

