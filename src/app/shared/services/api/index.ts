export type {
  HttpMethod,
  ApiOptions,
  ApiRetryOptions,
  ApiCacheOptions,
} from "./api.interfaces";

export { ApiError, apiService, rest, api } from "./api.service";
export { ApiDiagnostics } from "./api-diagnostics";

export const API_SERVICE_VERSION = "1.0.0";
export const isApiServiceWorking = (): boolean => true;
