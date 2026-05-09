import type { PermissionCheck } from "../types";
import type { HttpClient } from "../http";

export class PermissionsClient {
  constructor(private readonly http: HttpClient) {}
  has(permission: string, resource?: string) { return this.http.get<PermissionCheck>("/permissions/check", { query: { permission, resource } }); }
  hasFeature(feature: string) { return this.http.get<PermissionCheck>("/permissions/features/check", { query: { feature } }); }
  listMine() { return this.http.get<{ permissions: string[]; features: Record<string, boolean>; roles: string[] }>("/permissions/me"); }
  require(permission: string, resource?: string) { return this.http.post<PermissionCheck>("/permissions/require", { permission, resource }); }
}
