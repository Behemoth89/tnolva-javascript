/**
 * Standard API response wrapper interface
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

/**
 * Error response type
 */
export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  errors?: string[];
}
