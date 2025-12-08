export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type Member = {
  id: string;
  userId: string;
  username: string;
  name: string; // 실제 사용자 이름
  email: string;
  profileImage?: string;
  role: MemberRole;
  status: InvitationStatus;
  joinedAt?: string;
  invitedAt?: string;
  invitedBy?: {
    id: string;
    username: string;
  };
  invitedByName?: string;
};

export type TravelPlanInvitation = {
  id: string;
  travelPlanId: string;
  travelPlanTitle: string;
  role: MemberRole;
  status: InvitationStatus;
  invitedAt: string;
  invitedBy: {
    id: string;
    username: string;
  };
};

