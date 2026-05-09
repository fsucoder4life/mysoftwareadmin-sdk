import type { TenantInfo } from "../types";
import type { HttpClient } from "../http";
export declare class TenantsClient {
    private readonly http;
    private readonly setTenantId;
    constructor(http: HttpClient, setTenantId: (tenantId?: string) => void);
    current(): Promise<TenantInfo>;
    get(idOrSlug: string): Promise<TenantInfo>;
    list(): Promise<{
        items: TenantInfo[];
    }>;
    resolveByHost(hostname: string): Promise<TenantInfo>;
    switch(tenantId: string): Promise<TenantInfo>;
    provision(input: {
        name: string;
        slug: string;
        apps?: string[];
        ownerEmail?: string;
    }): Promise<TenantInfo>;
}
//# sourceMappingURL=index.d.ts.map