import request from '../utils/request';
import type { ApiResponse } from '@/types/api';

export type UploadBizType = 'avatar' | 'diary_image';

export interface UploadedFile {
  fileId: string;
  bizType: string;
  fileUrl: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  storageProvider?: string;
  createdAt?: string;
}

export async function uploadFile(file: File, bizType: UploadBizType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bizType', bizType);

  return request.post<ApiResponse<UploadedFile>>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
