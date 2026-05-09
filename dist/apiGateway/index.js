export class ApiGatewayClient {
    constructor(http) {
        this.http = http;
    }
    get(path, options) { return this.http.get(path, options); }
    post(path, body, options) { return this.http.post(path, body, options); }
    put(path, body, options) { return this.http.put(path, body, options); }
    patch(path, body, options) { return this.http.patch(path, body, options); }
    delete(path, options) { return this.http.delete(path, options); }
    service(serviceName, route, body) {
        return this.http.post(`/gateway/services/${encodeURIComponent(serviceName)}`, { route, body });
    }
}
//# sourceMappingURL=index.js.map