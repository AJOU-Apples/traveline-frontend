import { authApi } from './authApi';
import { getApiBaseUrl } from './apiConfig';
import type {
  TravelPost,
  TravelPostComment,
  CreateTravelPostRequest,
  UpdateTravelPostRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  TravelPostListResponse,
  CommentListResponse,
  CreateReportRequest,
  ReportResponse,
} from '../types/travelPost.types';

const API_BASE_URL = getApiBaseUrl();

class TravelPostApi {
  // ============ 여행기 CRUD ============

  // 여행기 생성
  async createTravelPost(request: CreateTravelPostRequest): Promise<TravelPost> {
    try {
      const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-posts`, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '여행기 생성에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Create travel post error:', error);
      throw error;
    }
  }

  // 여행기 목록 조회 (PUBLIC 여행기는 인증 불필요)
  async getTravelPosts(params?: {
    page?: number;
    size?: number;
    visibility?: 'PUBLIC';
    authorId?: number;
    sort?: 'createdAt' | 'likeCount' | 'viewCount';
    keyword?: string; // 검색어
  }): Promise<TravelPostListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.visibility) queryParams.append('visibility', params.visibility);
      if (params?.authorId !== undefined) queryParams.append('authorId', params.authorId.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.keyword) queryParams.append('keyword', params.keyword);

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/travel-posts${queryString ? `?${queryString}` : ''}`;

      // PUBLIC 여행기 조회는 인증 없이도 가능
      const response = await authApi.optionalAuthFetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('여행기 목록 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Get travel posts error:', error);
      throw error;
    }
  }

  // 여행기 상세 조회 (PUBLIC 여행기는 인증 불필요)
  async getTravelPost(postId: number): Promise<TravelPost> {
    try {
      // PUBLIC 여행기는 인증 없이도 조회 가능
      const response = await authApi.optionalAuthFetch(`${API_BASE_URL}/travel-posts/${postId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('이 여행기에 접근할 권한이 없습니다.');
        }
        if (response.status === 404) {
          throw new Error('여행기를 찾을 수 없습니다.');
        }
        throw new Error('여행기 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Get travel post error:', error);
      throw error;
    }
  }

  // 링크로 여행기 조회 (인증 불필요)
  async getTravelPostByShareCode(shareCode: string): Promise<TravelPost> {
    try {
      const response = await fetch(`${API_BASE_URL}/travel-posts/share/${shareCode}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('여행기를 찾을 수 없습니다.');
        }
        throw new Error('여행기 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Get travel post by share code error:', error);
      throw error;
    }
  }

  // 여행기 수정
  async updateTravelPost(postId: number, request: UpdateTravelPostRequest): Promise<TravelPost> {
    try {
      const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('이 여행기를 수정할 권한이 없습니다.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '여행기 수정에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Update travel post error:', error);
      throw error;
    }
  }

  // 여행기 삭제
  async deleteTravelPost(postId: number): Promise<void> {
    try {
      const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('이 여행기를 삭제할 권한이 없습니다.');
        }
        throw new Error('여행기 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete travel post error:', error);
      throw error;
    }
  }

  // 내 여행기 목록 조회
  async getMyTravelPosts(params?: {
    page?: number;
    size?: number;
  }): Promise<TravelPostListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/travel-posts/my${queryString ? `?${queryString}` : ''}`;

      const response = await authApi.authenticatedFetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('내 여행기 목록 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Get my travel posts error:', error);
      throw error;
    }
  }

  // 좋아요한 여행기 목록 조회
  async getLikedTravelPosts(params?: {
    page?: number;
    size?: number;
  }): Promise<TravelPostListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/travel-posts/liked${queryString ? `?${queryString}` : ''}`;

      const response = await authApi.authenticatedFetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('좋아요한 여행기 목록 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Get liked travel posts error:', error);
      throw error;
    }
  }

  // ============ 좋아요 ============

  // 여행기 좋아요 토글
  async toggleLike(postId: number): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const response = await authApi.authenticatedFetch(`${API_BASE_URL}/travel-posts/${postId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('좋아요 처리에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  }

  // ============ 댓글 ============

  // 댓글 생성
  async createComment(postId: number, request: CreateCommentRequest): Promise<TravelPostComment> {
    try {
      const response = await authApi.authenticatedFetch(
        `${API_BASE_URL}/travel-posts/${postId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '댓글 작성에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Create comment error:', error);
      throw error;
    }
  }

  // 댓글 목록 조회 (PUBLIC 여행기의 댓글은 인증 불필요)
  async getComments(
    postId: number,
    params?: {
      page?: number;
      size?: number;
    }
  ): Promise<CommentListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/travel-posts/${postId}/comments${queryString ? `?${queryString}` : ''}`;

      // PUBLIC 여행기의 댓글은 인증 없이도 조회 가능
      const response = await authApi.optionalAuthFetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('댓글 목록 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  }

  // 댓글 수정
  async updateComment(
    postId: number,
    commentId: number,
    request: UpdateCommentRequest
  ): Promise<TravelPostComment> {
    try {
      const response = await authApi.authenticatedFetch(
        `${API_BASE_URL}/travel-posts/${postId}/comments/${commentId}`,
        {
          method: 'PUT',
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('이 댓글을 수정할 권한이 없습니다.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '댓글 수정에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  }

  // 댓글 삭제
  async deleteComment(postId: number, commentId: number): Promise<void> {
    try {
      const response = await authApi.authenticatedFetch(
        `${API_BASE_URL}/travel-posts/${postId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('이 댓글을 삭제할 권한이 없습니다.');
        }
        throw new Error('댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  }

  // 댓글 좋아요 토글
  async toggleCommentLike(
    postId: number,
    commentId: number
  ): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const response = await authApi.authenticatedFetch(
        `${API_BASE_URL}/travel-posts/${postId}/comments/${commentId}/like`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('댓글 좋아요 처리에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Toggle comment like error:', error);
      throw error;
    }
  }

  // ============ 신고 ============

  // 여행기 신고
  async reportTravelPost(postId: number, request: CreateReportRequest): Promise<ReportResponse> {
    try {
      const response = await authApi.authenticatedFetch(
        `${API_BASE_URL}/travel-posts/${postId}/reports`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('이미 신고한 콘텐츠입니다.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '신고 접수에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Report travel post error:', error);
      throw error;
    }
  }

  // 댓글 신고
  async reportComment(
    postId: number,
    commentId: number,
    request: CreateReportRequest
  ): Promise<ReportResponse> {
    try {
      const response = await authApi.authenticatedFetch(
        `${API_BASE_URL}/travel-posts/${postId}/comments/${commentId}/reports`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('이미 신고한 콘텐츠입니다.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '신고 접수에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Report comment error:', error);
      throw error;
    }
  }
}

export const travelPostApi = new TravelPostApi();

