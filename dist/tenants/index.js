export class TenantsClient {
    constructor(http, setTenantId) {
        this.http = http;
        this.setTenantId = setTenantId;
    }
    current() { return this.http.get("/tenants/current"); }
    get(idOrSlug) { return this.http.get(`/tenants/${encodeURIComponent(idOrSlug)}`); }
    list() { return this.http.get("/tenants"); }
    resolveByHost(hostname) { return this.http.get("/tenants/resolve", { query: { hostname } }); }
    switch(tenantId) { this.setTenantId(tenantId); return this.current(); }
    provision(input) { return this.http.post("/tenants", input); }
}
//# sourceMappingURL=index.js.map