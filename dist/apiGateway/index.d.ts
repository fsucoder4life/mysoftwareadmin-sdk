import type { HttpClient } from "../http";
import type { RequestOptions } from "../types";
export declare class ApiGatewayClient {
    private readonly http;
    constructor(http: HttpClient);
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    delete<T>(path: string, options?: RequestOptions): Promise<T>;
    service<T>(serviceName: string, route: string, body?: unknown): Promise<T>;
}
//# sourceMappingURL=index.d.ts.map