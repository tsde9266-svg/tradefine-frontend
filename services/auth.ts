import api from './api';
import { User } from '../types/user';
import { ApiResponse } from '../types/api';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function register(params: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'worker';
}): Promise<AuthPayload> {
  const { data } = await api.post<ApiResponse<AuthPayload>>('/api/auth/register', params);
  return data.data;
}

export async function login(params: {
  email: string;
  password: string;
}): Promise<AuthPayload> {
  const { data } = await api.post<ApiResponse<AuthPayload>>('/api/auth/login', params);
  return data.data;
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const { data } = await api.post<ApiResponse<AuthTokens>>('/api/auth/refresh', { refreshToken });
  return data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/api/auth/logout', { refreshToken });
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>('/api/auth/me');
  return data.data;
}

export interface SocialAuthPayload extends AuthPayload {
  isNewUser: boolean;
}

export async function socialAuth(params: {
  provider: 'google' | 'apple';
  token: string;
  role: 'customer' | 'worker';
  name?: string;
}): Promise<SocialAuthPayload> {
  const { data } = await api.post<ApiResponse<SocialAuthPayload>>('/api/auth/social', params);
  return data.data;
}
