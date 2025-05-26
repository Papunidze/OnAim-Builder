import type { ApiError } from "./api.service";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiRetryOptions {
  attempts?: number;
  delay?: number;
  backoff?: number;
  retryOn?: (error: ApiError<unknown>) => boolean;
}

export interface ApiCacheOptions {
  enabled?: boolean;
  ttl?: number;
  key?: string;
}

export interface ApiOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: BodyInit | null | Record<string, unknown>;
  params?: Record<string, string | number>;
  signal?: AbortSignal;
  onLoading?: (loading: boolean) => void;
  maxErrorMessageLength?: number;
  retry?: ApiRetryOptions;
  cache?: ApiCacheOptions;
  timeout?: number;
}
