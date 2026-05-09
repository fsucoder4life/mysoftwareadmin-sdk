export interface AccessTokenOptions {
    storageKey?: string;
    paramName?: string;
    saveToStorage?: boolean;
    removeFromUrl?: boolean;
}
export declare function saveAccessToken(token: string, options?: Pick<AccessTokenOptions, "storageKey">): boolean;
export declare function getAccessToken(options?: AccessTokenOptions): string | null;
export declare function removeAccessToken(options?: Pick<AccessTokenOptions, "storageKey">): boolean;
export declare function getLoginUrl(nextUrl: string | undefined, options: {
    serverUrl: string;
    appId: string;
    loginPath?: string;
}): string;
//# sourceMappingURL=authUtils.d.ts.map