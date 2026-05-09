export class EntityCollection {
    constructor(http, entityName) {
        this.http = http;
        this.entityName = entityName;
    }
    list(options = {}) { return this.http.get(`/entities/${encodeURIComponent(this.entityName)}`, { query: options }); }
    filter(filter, options = {}) { return this.list({ ...options, filter }); }
    get(id) { return this.http.get(`/entities/${encodeURIComponent(this.entityName)}/${encodeURIComponent(id)}`); }
    create(data) { return this.http.post(`/entities/${encodeURIComponent(this.entityName)}`, data); }
    update(id, data) { return this.http.patch(`/entities/${encodeURIComponent(this.entityName)}/${encodeURIComponent(id)}`, data); }
    upsert(key, data) { return this.http.put(`/entities/${encodeURIComponent(this.entityName)}/upsert/${encodeURIComponent(key)}`, data); }
    delete(id) { return this.http.delete(`/entities/${encodeURIComponent(this.entityName)}/${encodeURIComponent(id)}`); }
    restore(id) { return this.http.post(`/entities/${encodeURIComponent(this.entityName)}/${encodeURIComponent(id)}/restore`, {}); }
    schema() { return this.http.get(`/entities/${encodeURIComponent(this.entityName)}/schema`); }
}
export class EntitiesClient {
    constructor(http) {
        this.http = http;
    }
    collection(entityName) { return new EntityCollection(this.http, entityName); }
    listDefinitions() { return this.http.get("/entities"); }
    define(entityName, schema) { return this.http.put(`/entities/${encodeURIComponent(entityName)}/schema`, schema); }
    proxy() {
        return new Proxy({}, { get: (_target, prop) => this.collection(String(prop)) });
    }
}
//# sourceMappingURL=index.js.map