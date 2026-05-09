export class MySoftwareAdminError extends Error {
    constructor(message, status, code, details, requestId) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.requestId = requestId;
        this.name = "MySoftwareAdminError";
    }
}
export class AuthenticationError extends MySoftwareAdminError {
    constructor() {
        super(...arguments);
        this.name = "AuthenticationError";
    }
}
export class AuthorizationError extends MySoftwareAdminError {
    constructor() {
        super(...arguments);
        this.name = "AuthorizationError";
    }
}
export class ValidationError extends MySoftwareAdminError {
    constructor() {
        super(...arguments);
        this.name = "ValidationError";
    }
}
export class NotFoundError extends MySoftwareAdminError {
    constructor() {
        super(...arguments);
        this.name = "NotFoundError";
    }
}
export class NetworkError extends MySoftwareAdminError {
    constructor() {
        super(...arguments);
        this.name = "NetworkError";
    }
}
export function toSdkError(status, body, requestId) {
    const message = body?.message || body?.error || `Request failed with status ${status}`;
    const code = body?.code;
    if (status === 401)
        return new AuthenticationError(message, status, code, body, requestId);
    if (status === 403)
        return new AuthorizationError(message, status, code, body, requestId);
    if (status === 404)
        return new NotFoundError(message, status, code, body, requestId);
    if (status === 400 || status === 422)
        return new ValidationError(message, status, code, body, requestId);
    return new MySoftwareAdminError(message, status, code, body, requestId);
}
//# sourceMappingURL=errors.js.map