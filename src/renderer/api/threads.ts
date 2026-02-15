const API_BASE = 'http://localhost:4777';

export interface ThreadsAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  profileBanner?: string;
  profileFrame?: string;
}

export interface ThreadsPost {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
  author?: ThreadsAuthor;
}

export interface ThreadsProfile {
  profile: ThreadsAuthor;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: ThreadsPost[];
}

const handleJson = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

export const getThreadsFeed = async (token: string) => {
  const response = await fetch(`${API_BASE}/threads/feed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; posts: ThreadsPost[] }>;
};

export const createThreadsPost = async (token: string, content: string) => {
  const response = await fetch(`${API_BASE}/threads/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  return handleJson(response) as Promise<{ ok: boolean; post: ThreadsPost }>;
};

export const followThreadsUser = async (token: string, userId: string, action?: 'follow' | 'unfollow') => {
  const response = await fetch(`${API_BASE}/threads/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, action }),
  });
  return handleJson(response) as Promise<{ ok: boolean; following: boolean }>;
};

export const getThreadsProfile = async (token: string, userId: string) => {
  const response = await fetch(`${API_BASE}/threads/profile/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean } & ThreadsProfile>;
};
