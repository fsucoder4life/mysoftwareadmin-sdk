import type { HttpClient } from "../http";
import type { RequestOptions } from "../types";

export class ApiGatewayClient {
  constructor(private readonly http: HttpClient) {}
  get<T>(path: string, options?: RequestOptions) { return this.http.get<T>(path, options); }
  post<T>(path: string, body?: unknown, options?: RequestOptions) { return this.http.post<T>(path, body, options); }
  put<T>(path: string, body?: unknown, options?: RequestOptions) { return this.http.put<T>(path, body, options); }
  patch<T>(path: string, body?: unknown, options?: RequestOptions) { return this.http.patch<T>(path, body, options); }
  delete<T>(path: string, options?: RequestOptions) { return this.http.delete<T>(path, options); }
  service<T>(serviceName: string, route: string, body?: unknown) {
    return this.http.post<T>(`/gateway/services/${encodeURIComponent(serviceName)}`, { route, body });
  }
}
