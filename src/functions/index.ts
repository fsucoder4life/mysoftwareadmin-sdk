import type { FunctionInvokeResult } from "../types";
import type { HttpClient } from "../http";

export class FunctionsClient {
  constructor(private readonly http: HttpClient) {}
  invoke<T = unknown>(name: string, payload?: unknown): Promise<FunctionInvokeResult<T>> {
    return this.http.post<FunctionInvokeResult<T>>(`/functions/${encodeURIComponent(name)}/invoke`, payload ?? {});
  }
  list() { return this.http.get<Array<{ name: string; description?: string; inputSchema?: unknown }>>("/functions"); }
}
