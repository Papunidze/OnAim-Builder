export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: BodyInit | null | Record<string, unknown>;
  params?: Record<string, string | number>;
  signal?: AbortSignal;
  onLoading?: (loading: boolean) => void;
  maxErrorMessageLength?: number;
}

export class ApiError<ErrorPayload> extends Error {
  readonly status: number;
  readonly data?: ErrorPayload;

  constructor(message: string, status: number, data?: ErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function buildUrl(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string | number>
): string {
  const url = new URL(baseUrl + endpoint);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, String(value));
    }
  }
  return url.toString();
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
  } = options;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const url = buildUrl(baseUrl, endpoint, params);
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

  onLoading?.(true);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: processedBody,
      signal,
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

      throw new ApiError<ErrorPayload>(
        message.slice(0, maxErrorMessageLength),
        res.status,
        errorData
      );
    }

    if (res.status === 204 || res.headers.get("Content-Length") === "0") {
      return undefined as unknown as Data;
    }

    return (await res.json()) as Data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new ApiError(msg, 0);
  } finally {
    onLoading?.(false);
  }
}

export const rest = {
  GET: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: ApiOptions
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "GET" }),
  POST: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: ApiOptions
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "POST" }),
  PUT: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: ApiOptions
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "PUT" }),
  DELETE: <Data, ErrorPayload = unknown>(
    endpoint: string,
    opts?: ApiOptions
  ): Promise<Data> =>
    apiService<Data, ErrorPayload>(endpoint, { ...opts, method: "DELETE" }),
};
