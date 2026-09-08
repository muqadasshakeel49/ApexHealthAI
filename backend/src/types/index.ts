import { Request } from 'express';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
