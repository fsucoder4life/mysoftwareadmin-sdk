export class MySoftwareAdminError extends Error {
  readonly name: string = "MySoftwareAdminError";
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly requestId?: string
  ) {
    super(message);
  }
}

export class AuthenticationError extends MySoftwareAdminError {
  readonly name = "AuthenticationError";
}

export class AuthorizationError extends MySoftwareAdminError {
  readonly name = "AuthorizationError";
}

export class ValidationError extends MySoftwareAdminError {
  readonly name = "ValidationError";
}

export class NotFoundError extends MySoftwareAdminError {
  readonly name = "NotFoundError";
}

export class NetworkError extends MySoftwareAdminError {
  readonly name = "NetworkError";
}

export function toSdkError(status: number, body: any, requestId?: string): MySoftwareAdminError {
  const message = body?.message || body?.error || `Request failed with status ${status}`;
  const code = body?.code;
  if (status === 401) return new AuthenticationError(message, status, code, body, requestId);
  if (status === 403) return new AuthorizationError(message, status, code, body, requestId);
  if (status === 404) return new NotFoundError(message, status, code, body, requestId);
  if (status === 400 || status === 422) return new ValidationError(message, status, code, body, requestId);
  return new MySoftwareAdminError(message, status, code, body, requestId);
}
