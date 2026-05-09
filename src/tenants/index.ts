import type { TenantInfo } from "../types";
import type { HttpClient } from "../http";

export class TenantsClient {
  constructor(private readonly http: HttpClient, private readonly setTenantId: (tenantId?: string) => void) {}
  current() { return this.http.get<TenantInfo>("/tenants/current"); }
  get(idOrSlug: string) { return this.http.get<TenantInfo>(`/tenants/${encodeURIComponent(idOrSlug)}`); }
  list() { return this.http.get<{ items: TenantInfo[] }>("/tenants"); }
  resolveByHost(hostname: string) { return this.http.get<TenantInfo>("/tenants/resolve", { query: { hostname } }); }
  switch(tenantId: string) { this.setTenantId(tenantId); return this.current(); }
  provision(input: { name: string; slug: string; apps?: string[]; ownerEmail?: string }) { return this.http.post<TenantInfo>("/tenants", input); }
}
