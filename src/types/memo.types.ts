export type Author = {
  id: string;
  email: string;
  name: string;
  username: string;
  profileImageUrl?: string;
};

export type Memo = {
  id: string;
  placeId: string;
  author: Author;
  content: string;
  visibility: 'PERSONAL' | 'SHARED'; // 공개 설정
  createdAt: string;
  updatedAt: string;
};

