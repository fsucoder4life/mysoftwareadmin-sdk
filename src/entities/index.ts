import type { EntityRecord, ListOptions, PagedResult } from "../types";
import type { HttpClient } from "../http";

export class EntityCollection<T extends EntityRecord = EntityRecord> {
  constructor(private readonly http: HttpClient, private readonly entityName: string) {}
  list(options: ListOptions = {}) { return this.http.get<PagedResult<T>>(`/entities/${encodeURIComponent(this.entityName)}`, { query: options as Record<string, unknown> }); }
  filter(filter: Record<string, unknown>, options: Omit<ListOptions, "filter"> = {}) { return this.list({ ...options, filter }); }
  get(id: string) { return this.http.get<T>(`/entities/${encodeURIComponent(this.entityName)}/${encodeURIComponent(id)}`); }
  create(data: Partial<T>) { return this.http.post<T>(`/entities/${encodeURIComponent(this.entityName)}`, data); }
  update(id: string, data: Partial<T>) { return this.http.patch<T>(`/entities/${encodeURIComponent(this.entityName)}/${encodeURIComponent(id)}`, data); }
  upsert(key: string, data: Partial<T>) { return this.http.put<T>(`/entities/${encodeURIComponent(this.entityName)}/upsert/${encodeURIComponent(key)}`, data); }
  delete(id: string) { return this.http.delete<{ deleted: boolean }>(`/entities/${encodeURIComponent(this.entityName)}/${encodeURIComponent(id)}`); }
  restore(id: string) { return this.http.post<T>(`/entities/${encodeURIComponent(this.entityName)}/${encodeURIComponent(id)}/restore`, {}); }
  schema() { return this.http.get<Record<string, unknown>>(`/entities/${encodeURIComponent(this.entityName)}/schema`); }
}

export class EntitiesClient {
  constructor(private readonly http: HttpClient) {}
  collection<T extends EntityRecord = EntityRecord>(entityName: string) { return new EntityCollection<T>(this.http, entityName); }
  listDefinitions() { return this.http.get<Array<{ name: string; displayName?: string; schema?: unknown }>>("/entities"); }
  define(entityName: string, schema: Record<string, unknown>) { return this.http.put(`/entities/${encodeURIComponent(entityName)}/schema`, schema); }
  proxy(): Record<string, EntityCollection> {
    return new Proxy({}, { get: (_target, prop) => this.collection(String(prop)) }) as Record<string, EntityCollection>;
  }
}
