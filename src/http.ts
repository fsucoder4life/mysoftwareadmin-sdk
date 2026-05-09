import { NetworkError, toSdkError } from "./errors";
import type { MySoftwareAdminClientConfig, RequestOptions, TokenStorage, TenantContext } from "./types";

export class HttpClient {
  constructor(
    private readonly config: MySoftwareAdminClientConfig,
    private readonly tokenStorage: TokenStorage,
    private readonly getTenantContext: () => TenantContext
  ) {}

  async request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const headers = await this.buildHeaders(options);
    if (body instanceof FormData) delete headers["content-type"];
    const retry = this.config.retry ?? {};
    const attempts = retry.attempts ?? 1;
    const retryStatuses = retry.retryStatuses ?? [408, 429, 500, 502, 503, 504];

    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const controller = !options.signal && this.config.timeoutMs ? new AbortController() : undefined;
        const timeout = controller ? setTimeout(() => controller.abort(), this.config.timeoutMs) : undefined;
        const response = await fetch(url, {
          method,
          headers,
          body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
          signal: options.signal ?? controller?.signal
        });
        if (timeout) clearTimeout(timeout);

        const contentType = response.headers.get("content-type") || "";
        const responseBody = contentType.includes("application/json") ? await response.json().catch(() => undefined) : await response.text();
        const requestId = response.headers.get("x-request-id") ?? undefined;

        if (!response.ok) {
          if (attempt < attempts - 1 && retryStatuses.includes(response.status)) {
            await this.delay((retry.baseDelayMs ?? 250) * Math.pow(2, attempt));
            continue;
          }
          throw toSdkError(response.status, responseBody, requestId);
        }
        return responseBody as T;
      } catch (err) {
        lastError = err;
        if (attempt < attempts - 1) {
          await this.delay((retry.baseDelayMs ?? 250) * Math.pow(2, attempt));
          continue;
        }
      }
    }
    if (lastError instanceof Error && lastError.name !== "TypeError") throw lastError;
    throw new NetworkError(lastError instanceof Error ? lastError.message : "Network request failed");
  }

  get<T>(path: string, options?: RequestOptions) { return this.request<T>("GET", path, undefined, options); }
  post<T>(path: string, body?: unknown, options?: RequestOptions) { return this.request<T>("POST", path, body, options); }
  put<T>(path: string, body?: unknown, options?: RequestOptions) { return this.request<T>("PUT", path, body, options); }
  patch<T>(path: string, body?: unknown, options?: RequestOptions) { return this.request<T>("PATCH", path, body, options); }
  delete<T>(path: string, options?: RequestOptions) { return this.request<T>("DELETE", path, undefined, options); }

  private buildUrl(path: string, query?: Record<string, unknown>) {
    const base = this.config.apiBaseUrl.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base}${cleanPath}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === "object") url.searchParams.set(key, JSON.stringify(value));
        else url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  private async buildHeaders(options: RequestOptions): Promise<Record<string, string>> {
    const context = this.getTenantContext();
    const headers: Record<string, string> = {
      "accept": "application/json",
      ...(!(options.headers?.["content-type"] || options.headers?.["Content-Type"]) ? { "content-type": "application/json" } : {}),
      "x-msa-app-id": context.appId,
      ...(context.tenantId ? { "x-msa-tenant-id": context.tenantId } : {}),
      ...(context.organizationId ? { "x-msa-organization-id": context.organizationId } : {}),
      ...(context.environment ? { "x-msa-environment": context.environment } : {}),
      ...(this.config.defaultHeaders ?? {}),
      ...(options.headers ?? {})
    };
    if (!options.skipAuth) {
      const token = await this.tokenStorage.getAccessToken();
      if (token) headers.authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
}
