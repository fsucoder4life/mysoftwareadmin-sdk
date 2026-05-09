import type { AuthResult, CurrentUser, TokenStorage } from "../types";
import type { HttpClient } from "../http";
export declare class AuthClient {
    private readonly http;
    private readonly storage;
    constructor(http: HttpClient, storage: TokenStorage);
    loginWithPassword(email: string, password: string): Promise<AuthResult>;
    loginWithToken(accessToken: string, refreshToken?: string): Promise<void>;
    magicLink(email: string, redirectUrl?: string): Promise<{
        sent: boolean;
    }>;
    me(): Promise<CurrentUser>;
    refresh(): Promise<AuthResult>;
    logout(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map