import type { AIInvokeRequest, AIInvokeResult, EmailRequest } from "../types";
import type { HttpClient } from "../http";
export declare class AIIntegrationClient {
    private readonly http;
    constructor(http: HttpClient);
    invokeLLM(request: AIInvokeRequest): Promise<AIInvokeResult>;
    summarize(text: string, instructions?: string): Promise<AIInvokeResult>;
    extractJson<T = unknown>(prompt: string, schema?: unknown): Promise<T>;
}
export declare class EmailIntegrationClient {
    private readonly http;
    constructor(http: HttpClient);
    send(request: EmailRequest): Promise<{
        id: string;
        sent: boolean;
    }>;
}
export declare class IntegrationsClient {
    readonly AI: AIIntegrationClient;
    readonly Email: EmailIntegrationClient;
    readonly Core: AIIntegrationClient;
    constructor(http: HttpClient);
}
//# sourceMappingURL=index.d.ts.map