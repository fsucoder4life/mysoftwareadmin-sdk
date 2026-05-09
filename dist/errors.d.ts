export declare class MySoftwareAdminError extends Error {
    readonly status?: number | undefined;
    readonly code?: string | undefined;
    readonly details?: unknown | undefined;
    readonly requestId?: string | undefined;
    readonly name: string;
    constructor(message: string, status?: number | undefined, code?: string | undefined, details?: unknown | undefined, requestId?: string | undefined);
}
export declare class AuthenticationError extends MySoftwareAdminError {
    readonly name = "AuthenticationError";
}
export declare class AuthorizationError extends MySoftwareAdminError {
    readonly name = "AuthorizationError";
}
export declare class ValidationError extends MySoftwareAdminError {
    readonly name = "ValidationError";
}
export declare class NotFoundError extends MySoftwareAdminError {
    readonly name = "NotFoundError";
}
export declare class NetworkError extends MySoftwareAdminError {
    readonly name = "NetworkError";
}
export declare function toSdkError(status: number, body: any, requestId?: string): MySoftwareAdminError;
//# sourceMappingURL=errors.d.ts.map