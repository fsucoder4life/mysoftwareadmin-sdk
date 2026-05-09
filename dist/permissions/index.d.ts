import type { PermissionCheck } from "../types";
import type { HttpClient } from "../http";
export declare class PermissionsClient {
    private readonly http;
    constructor(http: HttpClient);
    has(permission: string, resource?: string): Promise<PermissionCheck>;
    hasFeature(feature: string): Promise<PermissionCheck>;
    listMine(): Promise<{
        permissions: string[];
        features: Record<string, boolean>;
        roles: string[];
    }>;
    require(permission: string, resource?: string): Promise<PermissionCheck>;
}
//# sourceMappingURL=index.d.ts.map