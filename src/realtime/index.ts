import type { MySoftwareAdminClientConfig, RealtimeEvent, RealtimeHandler, TenantContext } from "../types";
import type { TokenStorage } from "../types";

export class RealtimeClient {
  private eventSource?: EventSource;
  private handlers = new Map<string, Set<RealtimeHandler>>();

  constructor(
    private readonly config: MySoftwareAdminClientConfig,
    private readonly storage: TokenStorage,
    private readonly getTenantContext: () => TenantContext
  ) {}

  async connect(channels: string[] = ["*"]): Promise<void> {
    if (typeof EventSource === "undefined") return;
    const context = this.getTenantContext();
    const token = await this.storage.getAccessToken();
    const base = this.config.realtime?.url ?? this.config.apiBaseUrl.replace(/\/$/, "") + "/realtime/events";
    const url = new URL(base);
    url.searchParams.set("appId", context.appId);
    if (context.tenantId) url.searchParams.set("tenantId", context.tenantId);
    url.searchParams.set("channels", channels.join(","));
    if (token) url.searchParams.set("access_token", token);
    this.eventSource = new EventSource(url.toString());
    this.eventSource.onmessage = (message) => this.dispatch(JSON.parse(message.data));
  }

  subscribe<T = unknown>(type: string, handler: RealtimeHandler<T>): () => void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as RealtimeHandler);
    this.handlers.set(type, set);
    return () => set.delete(handler as RealtimeHandler);
  }

  onAny(handler: RealtimeHandler): () => void { return this.subscribe("*", handler); }
  close() { this.eventSource?.close(); this.eventSource = undefined; }

  private dispatch(event: RealtimeEvent) {
    this.handlers.get(event.type)?.forEach(h => h(event));
    this.handlers.get("*")?.forEach(h => h(event));
  }
}
