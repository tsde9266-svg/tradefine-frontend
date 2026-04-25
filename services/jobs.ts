import api from './api';
import { JobRequest } from '../types/job';

const BASE = '/api/jobs';

export async function createJobRequest(data: {
  workerId: string;
  type: 'in_app' | 'call';
  description?: string;
}): Promise<JobRequest> {
  const res = await api.post(BASE, data);
  return res.data.data;
}

export async function getActiveJobs(): Promise<JobRequest[]> {
  const res = await api.get(`${BASE}/active`);
  return res.data.data ?? [];
}

export async function getJobById(id: string): Promise<JobRequest> {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

export async function respondToJob(
  id: string,
  action: 'accept' | 'decline' | 'confirm_call',
): Promise<JobRequest> {
  const res = await api.patch(`${BASE}/${id}/respond`, { action });
  return res.data.data;
}

export async function startJob(id: string): Promise<JobRequest> {
  const res = await api.patch(`${BASE}/${id}/start`);
  return res.data.data;
}

export async function completeJob(id: string): Promise<JobRequest> {
  const res = await api.patch(`${BASE}/${id}/complete`);
  return res.data.data;
}

export async function cancelJob(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
