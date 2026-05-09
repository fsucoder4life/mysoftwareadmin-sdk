import type { MySoftwareAdminClientConfig, RequestOptions, TokenStorage, TenantContext } from "./types";
export declare class HttpClient {
    private readonly config;
    private readonly tokenStorage;
    private readonly getTenantContext;
    constructor(config: MySoftwareAdminClientConfig, tokenStorage: TokenStorage, getTenantContext: () => TenantContext);
    request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    delete<T>(path: string, options?: RequestOptions): Promise<T>;
    private buildUrl;
    private buildHeaders;
    private delay;
}
//# sourceMappingURL=http.d.ts.map