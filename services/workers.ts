import api from './api';
import { Worker } from '../types/worker';
import { ApiResponse } from '../types/api';

export interface NearbyParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  trade?: string;
  availableOnly?: boolean;
  sortBy?: 'distance' | 'rating';
}

export async function getNearbyWorkers(params: NearbyParams): Promise<Worker[]> {
  const { data } = await api.get<ApiResponse<Worker[]>>('/api/workers/nearby', { params });
  return data.data;
}

export async function getWorkerById(id: string): Promise<Worker> {
  const { data } = await api.get<ApiResponse<Worker>>(`/api/workers/${id}`);
  return data.data;
}

export async function updateWorkerProfile(updates: Partial<Worker>): Promise<Worker> {
  const { data } = await api.patch<ApiResponse<Worker>>('/api/workers/profile', updates);
  return data.data;
}

export async function toggleAvailability(params: {
  available: boolean;
  lat?: number;
  lng?: number;
}): Promise<void> {
  await api.patch('/api/workers/availability', params);
}

export async function getSavedWorkers(): Promise<Worker[]> {
  const { data } = await api.get<ApiResponse<Worker[]>>('/api/workers/saved');
  return data.data;
}

export async function saveWorker(id: string): Promise<void> {
  await api.post(`/api/workers/${id}/save`);
}

export async function unsaveWorker(id: string): Promise<void> {
  await api.delete(`/api/workers/${id}/save`);
}
