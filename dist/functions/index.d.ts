import type { FunctionInvokeResult } from "../types";
import type { HttpClient } from "../http";
export declare class FunctionsClient {
    private readonly http;
    constructor(http: HttpClient);
    invoke<T = unknown>(name: string, payload?: unknown): Promise<FunctionInvokeResult<T>>;
    list(): Promise<{
        name: string;
        description?: string;
        inputSchema?: unknown;
    }[]>;
}
//# sourceMappingURL=index.d.ts.map