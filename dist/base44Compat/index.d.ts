import type { MySoftwareAdminClientConfig, TokenStorage } from "../types";
import { MySoftwareAdminClient } from "../client";
export interface Base44CompatibleClientConfig {
    appId: string;
    /** Base44-style server root. Example: https://api.mysoftwareadmin.com or https://base44.app */
    serverUrl?: string;
    /** Native MySoftwareAdmin API base URL. If omitted, `${serverUrl}/api` is used. */
    apiBaseUrl?: string;
    appBaseUrl?: string;
    token?: string;
    serviceToken?: string;
    requiresAuth?: boolean;
    functionsVersion?: string;
    headers?: Record<string, string>;
    options?: {
        onError?: (error: unknown) => void;
    };
    tenantId?: string;
    organizationId?: string;
    environment?: string;
    tokenStorage?: MySoftwareAdminClientConfig["tokenStorage"];
    customTokenStorage?: TokenStorage;
    timeoutMs?: number;
    retry?: MySoftwareAdminClientConfig["retry"];
}
export declare class Base44Error extends Error {
    readonly status?: number | undefined;
    readonly code?: string | undefined;
    readonly data?: unknown | undefined;
    readonly originalError?: unknown | undefined;
    constructor(message: string, status?: number | undefined, code?: string | undefined, data?: unknown | undefined, originalError?: unknown | undefined);
    toJSON(): {
        name: string;
        message: string;
        status: number | undefined;
        code: string | undefined;
        data: unknown;
    };
}
type AnyObject = Record<string, any>;
export declare function createBase44CompatibleClient(config: Base44CompatibleClientConfig): AnyObject;
export declare const createClient: typeof createBase44CompatibleClient;
export declare const createClientCompat: typeof createBase44CompatibleClient;
export declare function createPlatformClient(config: MySoftwareAdminClientConfig): MySoftwareAdminClient;
export {};
//# sourceMappingURL=index.d.ts.map