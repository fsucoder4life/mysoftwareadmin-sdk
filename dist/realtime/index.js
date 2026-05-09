export class RealtimeClient {
    constructor(config, storage, getTenantContext) {
        this.config = config;
        this.storage = storage;
        this.getTenantContext = getTenantContext;
        this.handlers = new Map();
    }
    async connect(channels = ["*"]) {
        if (typeof EventSource === "undefined")
            return;
        const context = this.getTenantContext();
        const token = await this.storage.getAccessToken();
        const base = this.config.realtime?.url ?? this.config.apiBaseUrl.replace(/\/$/, "") + "/realtime/events";
        const url = new URL(base);
        url.searchParams.set("appId", context.appId);
        if (context.tenantId)
            url.searchParams.set("tenantId", context.tenantId);
        url.searchParams.set("channels", channels.join(","));
        if (token)
            url.searchParams.set("access_token", token);
        this.eventSource = new EventSource(url.toString());
        this.eventSource.onmessage = (message) => this.dispatch(JSON.parse(message.data));
    }
    subscribe(type, handler) {
        const set = this.handlers.get(type) ?? new Set();
        set.add(handler);
        this.handlers.set(type, set);
        return () => set.delete(handler);
    }
    onAny(handler) { return this.subscribe("*", handler); }
    close() { this.eventSource?.close(); this.eventSource = undefined; }
    dispatch(event) {
        this.handlers.get(event.type)?.forEach(h => h(event));
        this.handlers.get("*")?.forEach(h => h(event));
    }
}
//# sourceMappingURL=index.js.map