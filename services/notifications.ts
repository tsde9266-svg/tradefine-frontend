import api from './api';
import { Notification } from '../types/notification';
import { ApiResponse } from '../types/api';

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get<ApiResponse<Notification[]>>('/api/notifications');
  return data.data;
}

export async function markAllRead(): Promise<void> {
  await api.patch('/api/notifications/read-all');
}

export async function markOneRead(id: string): Promise<void> {
  await api.patch(`/api/notifications/${id}/read`);
}
