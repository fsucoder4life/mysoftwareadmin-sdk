export class PermissionsClient {
    constructor(http) {
        this.http = http;
    }
    has(permission, resource) { return this.http.get("/permissions/check", { query: { permission, resource } }); }
    hasFeature(feature) { return this.http.get("/permissions/features/check", { query: { feature } }); }
    listMine() { return this.http.get("/permissions/me"); }
    require(permission, resource) { return this.http.post("/permissions/require", { permission, resource }); }
}
//# sourceMappingURL=index.js.map