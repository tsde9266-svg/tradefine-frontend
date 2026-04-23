import api from './api';
import { Review } from '../types/review';
import { ApiResponse } from '../types/api';

export async function getWorkerReviews(workerId: string): Promise<Review[]> {
  const { data } = await api.get<ApiResponse<Review[]>>(`/api/reviews/worker/${workerId}`);
  return data.data;
}

export async function getCustomerReviews(customerId: string): Promise<Review[]> {
  const { data } = await api.get<ApiResponse<Review[]>>(`/api/reviews/customer/${customerId}`);
  return data.data;
}

export async function createReview(params: {
  toId: string;
  toType: 'worker' | 'customer';
  rating: number;
  text: string;
  photos: string[];
}): Promise<Review> {
  const { data } = await api.post<ApiResponse<Review>>('/api/reviews', params);
  return data.data;
}

export async function replyToReview(reviewId: string, reply: string): Promise<void> {
  await api.post(`/api/reviews/${reviewId}/reply`, { reply });
}

export async function reportReview(reviewId: string, reason: string): Promise<void> {
  await api.post(`/api/reviews/${reviewId}/report`, { reason });
}
