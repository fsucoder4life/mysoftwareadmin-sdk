import type { EntityRecord, ListOptions, PagedResult } from "../types";
import type { HttpClient } from "../http";
export declare class EntityCollection<T extends EntityRecord = EntityRecord> {
    private readonly http;
    private readonly entityName;
    constructor(http: HttpClient, entityName: string);
    list(options?: ListOptions): Promise<PagedResult<T>>;
    filter(filter: Record<string, unknown>, options?: Omit<ListOptions, "filter">): Promise<PagedResult<T>>;
    get(id: string): Promise<T>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T>;
    upsert(key: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<{
        deleted: boolean;
    }>;
    restore(id: string): Promise<T>;
    schema(): Promise<Record<string, unknown>>;
}
export declare class EntitiesClient {
    private readonly http;
    constructor(http: HttpClient);
    collection<T extends EntityRecord = EntityRecord>(entityName: string): EntityCollection<T>;
    listDefinitions(): Promise<{
        name: string;
        displayName?: string;
        schema?: unknown;
    }[]>;
    define(entityName: string, schema: Record<string, unknown>): Promise<unknown>;
    proxy(): Record<string, EntityCollection>;
}
//# sourceMappingURL=index.d.ts.map