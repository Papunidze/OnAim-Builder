import type { ApiOptions } from "./api.interfaces";

export class ApiError<ErrorPayload = unknown> extends Error {
  readonly status: number;
  readonly data?: ErrorPayload;
  readonly url?: string;
  readonly timestamp: number;

  constructor(
    message: string,
    status: number,
    data?: ErrorPayload,
    url?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.url = url;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  isNetworkError(): boolean {
    return this.status === 0 || this.status >= 500;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();

  set(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const apiCache = new ApiCache();

function buildUrl(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string | number>
): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${baseUrl}${cleanEndpoint}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, String(value));
    }
  }
  return url.toString();
}

function createCacheKey(url: string, options: ApiOptions): string {
  const { method = "GET", body, headers } = options;
  return `${method}:${url}:${JSON.stringify(body)}:${JSON.stringify(headers)}`;
}

async function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, ms);
  });
}

export async function apiService<Data, ErrorPayload = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<Data> {
  const {
    method = "GET",
    headers: userHeaders = {},
    body,
    params,
    signal,
    onLoading,
    maxErrorMessageLength = 500,
    retry = {},
    cache = {},
    timeout = 30000,
  } = options;

  const {
    attempts = 3,
    delay: retryDelay = 1000,
    backoff = 2,
    retryOn = function (error: ApiError<unknown>): boolean {
      return error.isNetworkError();
    },
  } = retry;

  const {
    enabled: cacheEnabled = method === "GET",
    ttl = 5 * 60 * 1000,
    key: customCacheKey,
  } = cache;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const url = buildUrl(baseUrl, endpoint, params);
  const cacheKey = customCacheKey || createCacheKey(url, options);

  if (cacheEnabled && method === "GET") {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return cachedData as Data;
    }
  }

  const headers = new Headers(userHeaders);
  let processedBody: BodyInit | null | undefined;

  if (method !== "GET" && body !== undefined) {
    if (body === null) {
      const contentType = (headers.get("Content-Type") || "").toLowerCase();
      if (
        contentType.includes("application/json") ||
        !headers.has("Content-Type")
      ) {
        headers.set("Content-Type", "application/json");
        processedBody = "null";
      } else {
        processedBody = null;
      }
    } else if (
      typeof body === "object" &&
      !(body instanceof Blob) &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof ReadableStream)
    ) {
      const ct = (headers.get("Content-Type") || "").toLowerCase();
      if (ct.includes("application/json") || !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
        processedBody = JSON.stringify(body);
      } else {
        processedBody = body as BodyInit;
      }
    } else {
      processedBody = body as BodyInit;
    }
  }

  let timeoutId: NodeJS.Timeout | undefined;
  let combinedSignal = signal;

  if (timeout > 0) {
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }
    combinedSignal = controller.signal;
  }

  async function executeRequest(attemptNumber: number): Promise<Data> {
    onLoading?.(true);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: processedBody,
        signal: combinedSignal,
      });

      if (!res.ok) {
        let errorData: ErrorPayload | undefined;
        let text = "";
        try {
          text = await res.text();
          if (
            text &&
            res.headers.get("Content-Type")?.includes("application/json")
          ) {
            errorData = JSON.parse(text) as ErrorPayload;
          }
        } catch {
          // ignore
        }

        const msgFromData =
          errorData &&
          typeof errorData === "object" &&
          errorData !== null &&
          "message" in errorData
            ? (errorData as { message: string }).message
            : undefined;

        const message =
          msgFromData ||
          text ||
          `Request to ${endpoint} failed: ${res.status} ${res.statusText}`;

        const apiError = new ApiError<ErrorPayload>(
          message.slice(0, maxErrorMessageLength),
          res.status,
          errorData,
          url
        );

        if (attemptNumber < attempts && retryOn(apiError)) {
          const delayMs = retryDelay * Math.pow(backoff, attemptNumber - 1);
          await delay(delayMs);
          return executeRequest(attemptNumber + 1);
        }

        throw apiError;
      }

      if (res.status === 204 || res.headers.get("Content-Length") === "0") {
        const result = undefined as unknown as Data;

        if (cacheEnabled && method === "GET") {
          apiCache.set(cacheKey, result, ttl);
        }

        return result;
      }

      const result = (await res.json()) as Data;

      if (cacheEnabled && method === "GET") {
        apiCache.set(cacheKey, result, ttl);
      }

      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }

      const apiError = new ApiError(
        err instanceof Error ? err.message : String(err),
        0,
        undefined,
        url
      );

      if (attemptNumber < attempts && retryOn(apiError)) {
        const delayMs = retryDelay * Math.pow(backoff, attemptNumber - 1);
        await delay(delayMs);
        return executeRequest(attemptNumber + 1);
      }

      throw apiError;
    }
  }

  try {
    return await executeRequest(1);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    onLoading?.(false);
  }
}

export const rest = {
  GET: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: Omit<ApiOptions, "method">
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "GET" }),

  POST: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: Omit<ApiOptions, "method">
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "POST" }),

  PUT: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: Omit<ApiOptions, "method">
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "PUT" }),

  PATCH: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: Omit<ApiOptions, "method">
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "PATCH" }),

  DELETE: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: Omit<ApiOptions, "method">
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "DELETE" }),
};

export const api = {
  ...rest,

  clearCache: (): void => {
    apiCache.clear();
  },

  clearCacheEntry: (
    endpoint: string,
    options: Partial<ApiOptions> = {}
  ): void => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const url = buildUrl(baseUrl, endpoint, options.params);
    const cacheKey = createCacheKey(url, options as ApiOptions);
    apiCache.delete(cacheKey);
  },

  uploadFile: async <Data = unknown>(
    endpoint: string,
    file: File,
    options?: {
      onProgress?: (progress: number) => void;
      additionalData?: Record<string, string>;
    } & Omit<ApiOptions, "body" | "method">
  ): Promise<Data> => {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return apiService<Data>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  },

  downloadFile: async (
    endpoint: string,
    filename?: string,
    options?: ApiOptions & { body?: unknown }
  ): Promise<void> => {
    const { method = "GET", headers, body, params, signal } = options || {};

    let processedBody: BodyInit | undefined;
    const requestHeaders = new Headers(headers);

    if (method === "POST" && body !== undefined) {
      if (
        typeof body === "object" &&
        !(body instanceof Blob) &&
        !(body instanceof FormData) &&
        !(body instanceof URLSearchParams) &&
        !(body instanceof ReadableStream)
      ) {
        const contentType = requestHeaders.get("Content-Type") || "";
        if (
          contentType.includes("application/json") ||
          !requestHeaders.has("Content-Type")
        ) {
          requestHeaders.set("Content-Type", "application/json");
          processedBody = JSON.stringify(body);
        } else {
          processedBody = body as BodyInit;
        }
      } else {
        processedBody = body as BodyInit;
      }
    }

    const response = await fetch(
      buildUrl(
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
        endpoint,
        params
      ),
      {
        method,
        headers: requestHeaders,
        body: processedBody,
        signal,
      }
    );

    if (!response.ok) {
      throw new ApiError(
        `Download failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
