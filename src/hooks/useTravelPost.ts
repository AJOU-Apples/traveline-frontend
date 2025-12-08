import { useState, useCallback } from 'react';
import { travelPostApi } from '../utils/travelPostApi';
import { travelPlanApi, TravelPlanDto } from '../utils/travelPlanApi';
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

export const useTravelPost = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 여행기 생성
  const createTravelPost = useCallback(async (request: CreateTravelPostRequest): Promise<TravelPost> => {
    try {
      setIsLoading(true);
      setError(null);
      const post = await travelPostApi.createTravelPost(request);
      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '여행기 생성에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 여행기 목록 조회
  const getTravelPosts = useCallback(
    async (params?: {
      page?: number;
      size?: number;
      visibility?: 'PUBLIC';
      authorId?: number;
      sort?: 'createdAt' | 'likeCount' | 'viewCount';
      keyword?: string;
    }): Promise<TravelPostListResponse> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await travelPostApi.getTravelPosts(params);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '여행기 목록 조회에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 여행기 상세 조회
  const getTravelPost = useCallback(async (postId: number): Promise<TravelPost> => {
    try {
      setIsLoading(true);
      setError(null);
      const post = await travelPostApi.getTravelPost(postId);
      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '여행기 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 링크로 여행기 조회
  const getTravelPostByShareCode = useCallback(async (shareCode: string): Promise<TravelPost> => {
    try {
      setIsLoading(true);
      setError(null);
      const post = await travelPostApi.getTravelPostByShareCode(shareCode);
      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '여행기 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 여행기 수정
  const updateTravelPost = useCallback(
    async (postId: number, request: UpdateTravelPostRequest): Promise<TravelPost> => {
      try {
        setIsLoading(true);
        setError(null);
        const post = await travelPostApi.updateTravelPost(postId, request);
        return post;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '여행기 수정에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 여행기 삭제
  const deleteTravelPost = useCallback(async (postId: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await travelPostApi.deleteTravelPost(postId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '여행기 삭제에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 내 여행기 목록 조회
  const getMyTravelPosts = useCallback(
    async (params?: { page?: number; size?: number }): Promise<TravelPostListResponse> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await travelPostApi.getMyTravelPosts(params);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '내 여행기 목록 조회에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 좋아요한 여행기 목록 조회
  const getLikedTravelPosts = useCallback(
    async (params?: { page?: number; size?: number }): Promise<TravelPostListResponse> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await travelPostApi.getLikedTravelPosts(params);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '좋아요한 여행기 목록 조회에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 좋아요 토글
  const toggleLike = useCallback(
    async (postId: number): Promise<{ isLiked: boolean; likeCount: number }> => {
      try {
        setError(null);
        const result = await travelPostApi.toggleLike(postId);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '좋아요 처리에 실패했습니다.';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // 댓글 생성
  const createComment = useCallback(
    async (postId: number, request: CreateCommentRequest): Promise<TravelPostComment> => {
      try {
        setIsLoading(true);
        setError(null);
        const comment = await travelPostApi.createComment(postId, request);
        return comment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '댓글 작성에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 댓글 목록 조회
  const getComments = useCallback(
    async (
      postId: number,
      params?: { page?: number; size?: number }
    ): Promise<CommentListResponse> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await travelPostApi.getComments(postId, params);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '댓글 목록 조회에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 댓글 수정
  const updateComment = useCallback(
    async (
      postId: number,
      commentId: number,
      request: UpdateCommentRequest
    ): Promise<TravelPostComment> => {
      try {
        setIsLoading(true);
        setError(null);
        const comment = await travelPostApi.updateComment(postId, commentId, request);
        return comment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '댓글 수정에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 댓글 삭제
  const deleteComment = useCallback(async (postId: number, commentId: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await travelPostApi.deleteComment(postId, commentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 댓글 좋아요 토글
  const toggleCommentLike = useCallback(
    async (
      postId: number,
      commentId: number
    ): Promise<{ isLiked: boolean; likeCount: number }> => {
      try {
        setError(null);
        const result = await travelPostApi.toggleCommentLike(postId, commentId);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '댓글 좋아요 처리에 실패했습니다.';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // 여행기에서 여행 계획 복사
  const copyTravelPlanFromPost = useCallback(
    async (
      travelPostId: number,
      startDate: string,
      title?: string
    ): Promise<TravelPlanDto> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await travelPlanApi.copyFromTravelPost(travelPostId, startDate, title);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '여행 계획 복사에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 여행기 신고
  const reportTravelPost = useCallback(
    async (postId: number, request: CreateReportRequest): Promise<ReportResponse> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await travelPostApi.reportTravelPost(postId, request);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '신고 접수에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 댓글 신고
  const reportComment = useCallback(
    async (
      postId: number,
      commentId: number,
      request: CreateReportRequest
    ): Promise<ReportResponse> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await travelPostApi.reportComment(postId, commentId, request);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '신고 접수에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    createTravelPost,
    getTravelPosts,
    getTravelPost,
    getTravelPostByShareCode,
    updateTravelPost,
    deleteTravelPost,
    getMyTravelPosts,
    getLikedTravelPosts,
    toggleLike,
    createComment,
    getComments,
    updateComment,
    deleteComment,
    toggleCommentLike,
    copyTravelPlanFromPost,
    reportTravelPost,
    reportComment,
  };
};

