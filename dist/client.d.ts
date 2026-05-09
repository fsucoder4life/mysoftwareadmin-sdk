import { AuthClient } from "./auth";
import { EntitiesClient } from "./entities";
import { FilesClient } from "./files";
import { FunctionsClient } from "./functions";
import { IntegrationsClient } from "./integrations";
import { PermissionsClient } from "./permissions";
import { TenantsClient } from "./tenants";
import { ApiGatewayClient } from "./apiGateway";
import { RealtimeClient } from "./realtime";
import { HttpClient } from "./http";
import type { MySoftwareAdminClientConfig, TenantContext } from "./types";
export declare class MySoftwareAdminClient {
    private readonly config;
    private tenantId?;
    private readonly httpClient;
    readonly auth: AuthClient;
    readonly entities: EntitiesClient;
    readonly files: FilesClient;
    readonly functions: FunctionsClient;
    readonly integrations: IntegrationsClient;
    readonly permissions: PermissionsClient;
    readonly tenants: TenantsClient;
    readonly gateway: ApiGatewayClient;
    readonly realtime: RealtimeClient;
    constructor(config: MySoftwareAdminClientConfig);
    getTenantContext(): TenantContext;
    setTenant(tenantId?: string): this;
    raw(): HttpClient;
}
export declare function createClient(config: MySoftwareAdminClientConfig): MySoftwareAdminClient;
//# sourceMappingURL=client.d.ts.map