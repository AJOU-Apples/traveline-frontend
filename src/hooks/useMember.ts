import { travelPlanApi } from '../utils/travelPlanApi';
import type { Member, MemberRole, TravelPlanInvitation } from '../types/member.types';
import type { AuthUser } from '../types/user.types';

export const useMember = (authUser: AuthUser | null, loadTravelPlans?: () => Promise<void>) => {
  const inviteMember = async (planId: string, email: string, role: 'EDITOR' | 'VIEWER'): Promise<Member> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const memberDto = await travelPlanApi.inviteMember(parseInt(planId), { email, role });

      return {
        id: memberDto.id.toString(),
        userId: memberDto.userId.toString(),
        username: memberDto.username,
        name: memberDto.name,
        email: memberDto.email,
        profileImage: memberDto.profileImage,
        role: memberDto.role,
        status: memberDto.status,
        joinedAt: memberDto.joinedAt,
        invitedAt: memberDto.invitedAt,
        invitedBy: memberDto.invitedBy ? {
          id: memberDto.invitedBy.id.toString(),
          username: memberDto.invitedBy.username,
        } : undefined,
        invitedByName: memberDto.invitedByName,
      };
    } catch (error) {
      console.error('Failed to invite member:', error);
      throw error;
    }
  };

  const getMembersByPlan = async (planId: string): Promise<Member[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const membersDto = await travelPlanApi.getMembersByTravelPlan(parseInt(planId));

      return membersDto.map(member => ({
        id: member.id.toString(),
        userId: member.userId.toString(),
        username: member.username,
        name: member.name,
        email: member.email,
        profileImage: member.profileImage,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        invitedAt: member.invitedAt,
        invitedBy: member.invitedBy ? {
          id: member.invitedBy.id.toString(),
          username: member.invitedBy.username,
        } : undefined,
        invitedByName: member.invitedByName,
      }));
    } catch (error) {
      console.error('Failed to get members:', error);
      throw error;
    }
  };

  const getMyInvitations = async (): Promise<TravelPlanInvitation[]> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const invitationsDto = await travelPlanApi.getMyInvitations();

      return invitationsDto.map(invitation => ({
        id: invitation.id.toString(),
        travelPlanId: invitation.travelPlanId.toString(),
        travelPlanTitle: invitation.travelPlanTitle,
        role: invitation.role,
        status: invitation.status,
        invitedAt: invitation.invitedAt,
        invitedBy: {
          id: invitation.invitedBy.id.toString(),
          username: invitation.invitedBy.username,
        },
      }));
    } catch (error) {
      console.error('Failed to get invitations:', error);
      throw error;
    }
  };

  const acceptInvitation = async (memberId: string): Promise<Member> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const memberDto = await travelPlanApi.acceptInvitation(parseInt(memberId));

      // 여행 계획 목록 다시 로드
      if (loadTravelPlans) {
        await loadTravelPlans();
      }

      return {
        id: memberDto.id.toString(),
        userId: memberDto.userId.toString(),
        username: memberDto.username,
        name: memberDto.name,
        email: memberDto.email,
        profileImage: memberDto.profileImage,
        role: memberDto.role,
        status: memberDto.status,
        joinedAt: memberDto.joinedAt,
      };
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  };

  const rejectInvitation = async (memberId: string): Promise<Member> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const memberDto = await travelPlanApi.rejectInvitation(parseInt(memberId));

      return {
        id: memberDto.id.toString(),
        userId: memberDto.userId.toString(),
        username: memberDto.username,
        name: memberDto.name,
        email: memberDto.email,
        profileImage: memberDto.profileImage,
        role: memberDto.role,
        status: memberDto.status,
      };
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      throw error;
    }
  };

  const updateMemberRole = async (memberId: string, role: MemberRole): Promise<Member> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const memberDto = await travelPlanApi.updateMemberRole(parseInt(memberId), { role });

      return {
        id: memberDto.id.toString(),
        userId: memberDto.userId.toString(),
        username: memberDto.username,
        name: memberDto.name,
        email: memberDto.email,
        profileImage: memberDto.profileImage,
        role: memberDto.role,
        status: memberDto.status,
      };
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  };

  const removeMember = async (memberId: string): Promise<void> => {
    if (!authUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await travelPlanApi.removeMember(parseInt(memberId));
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  };

  return {
    inviteMember,
    getMembersByPlan,
    getMyInvitations,
    acceptInvitation,
    rejectInvitation,
    updateMemberRole,
    removeMember,
  };
};

