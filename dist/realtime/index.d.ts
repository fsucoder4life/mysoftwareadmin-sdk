import type { MySoftwareAdminClientConfig, RealtimeHandler, TenantContext } from "../types";
import type { TokenStorage } from "../types";
export declare class RealtimeClient {
    private readonly config;
    private readonly storage;
    private readonly getTenantContext;
    private eventSource?;
    private handlers;
    constructor(config: MySoftwareAdminClientConfig, storage: TokenStorage, getTenantContext: () => TenantContext);
    connect(channels?: string[]): Promise<void>;
    subscribe<T = unknown>(type: string, handler: RealtimeHandler<T>): () => void;
    onAny(handler: RealtimeHandler): () => void;
    close(): void;
    private dispatch;
}
//# sourceMappingURL=index.d.ts.map