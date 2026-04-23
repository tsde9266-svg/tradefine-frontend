import axios from 'axios';
import api from './api';
import { ApiResponse } from '../types/api';

interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

export async function getPresignedUrl(
  filename: string,
  contentType: string,
): Promise<PresignedUrlResponse> {
  const { data } = await api.post<ApiResponse<PresignedUrlResponse>>(
    '/api/upload/presign',
    { filename, contentType },
  );
  return data.data;
}

export async function uploadToR2(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  await axios.put(uploadUrl, blob, {
    headers: { 'Content-Type': contentType },
  });
}

export async function uploadImage(fileUri: string): Promise<string> {
  const filename = fileUri.split('/').pop() ?? `upload_${Date.now()}.jpg`;
  const contentType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const { uploadUrl, publicUrl } = await getPresignedUrl(filename, contentType);
  await uploadToR2(uploadUrl, fileUri, contentType);
  return publicUrl;
}
