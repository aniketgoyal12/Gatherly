import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Flag to track refreshing state to avoid cascading refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token from localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('gatherly_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle Envelope & 401 Token Refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and not already retried, attempt refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Avoid infinite loop if the refresh-token endpoint itself returns 401
      if (originalRequest.url?.includes('/auth/refresh-token') || originalRequest.url?.includes('/auth/login')) {
        localStorage.removeItem('gatherly_token');
        localStorage.removeItem('gatherly_user');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<ApiResponse<{ token?: string; accessToken?: string }>>(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken =
          refreshResponse.data?.data?.token ||
          refreshResponse.data?.data?.accessToken;

        if (newToken) {
          localStorage.setItem('gatherly_token', newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No new token provided by refresh endpoint');
        }
      } catch (refreshErr) {
        processQueue(refreshErr as Error, null);
        localStorage.removeItem('gatherly_token');
        localStorage.removeItem('gatherly_user');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const errorData = error.response?.data;
    const message = errorData?.message || error.message || 'An error occurred with the request';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
