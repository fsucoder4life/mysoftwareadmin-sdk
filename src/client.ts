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
import { createTokenStorage } from "./tokenStorage";
import type { MySoftwareAdminClientConfig, TenantContext } from "./types";

export class MySoftwareAdminClient {
  private tenantId?: string;
  private readonly httpClient: HttpClient;
  readonly auth: AuthClient;
  readonly entities: EntitiesClient;
  readonly files: FilesClient;
  readonly functions: FunctionsClient;
  readonly integrations: IntegrationsClient;
  readonly permissions: PermissionsClient;
  readonly tenants: TenantsClient;
  readonly gateway: ApiGatewayClient;
  readonly realtime: RealtimeClient;

  constructor(private readonly config: MySoftwareAdminClientConfig) {
    this.tenantId = config.tenantId;
    const storage = createTokenStorage(config.tokenStorage, config.appId, config.customTokenStorage);
    if (config.accessToken) void storage.setAccessToken(config.accessToken);
    if (config.refreshToken && storage.setRefreshToken) void storage.setRefreshToken(config.refreshToken);

    this.httpClient = new HttpClient(config, storage, () => this.getTenantContext());
    this.auth = new AuthClient(this.httpClient, storage);
    this.entities = new EntitiesClient(this.httpClient);
    this.files = new FilesClient(this.httpClient);
    this.functions = new FunctionsClient(this.httpClient);
    this.integrations = new IntegrationsClient(this.httpClient);
    this.permissions = new PermissionsClient(this.httpClient);
    this.tenants = new TenantsClient(this.httpClient, (tenantId) => { this.tenantId = tenantId; });
    this.gateway = new ApiGatewayClient(this.httpClient);
    this.realtime = new RealtimeClient(config, storage, () => this.getTenantContext());
  }

  getTenantContext(): TenantContext {
    return {
      appId: this.config.appId,
      tenantId: this.tenantId,
      organizationId: this.config.organizationId,
      environment: this.config.environment
    };
  }

  setTenant(tenantId?: string) { this.tenantId = tenantId; return this; }
  raw() { return this.httpClient; }
}

export function createClient(config: MySoftwareAdminClientConfig) {
  return new MySoftwareAdminClient(config);
}
