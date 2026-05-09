export class FunctionsClient {
    constructor(http) {
        this.http = http;
    }
    invoke(name, payload) {
        return this.http.post(`/functions/${encodeURIComponent(name)}/invoke`, payload ?? {});
    }
    list() { return this.http.get("/functions"); }
}
//# sourceMappingURL=index.js.map