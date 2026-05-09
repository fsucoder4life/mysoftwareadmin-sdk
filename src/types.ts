export type TokenStorageMode = "memory" | "localStorage" | "sessionStorage" | "custom";

export interface TokenStorage {
  getAccessToken(): string | null | Promise<string | null>;
  setAccessToken(token: string | null): void | Promise<void>;
  getRefreshToken?(): string | null | Promise<string | null>;
  setRefreshToken?(token: string | null): void | Promise<void>;
}

export interface MySoftwareAdminClientConfig {
  appId: string;
  apiBaseUrl: string;
  tenantId?: string;
  organizationId?: string;
  environment?: "local" | "dev" | "test" | "uat" | "prod" | string;
  tokenStorage?: TokenStorageMode;
  customTokenStorage?: TokenStorage;
  accessToken?: string;
  refreshToken?: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  retry?: RetryOptions;
  realtime?: RealtimeOptions;
}

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  retryStatuses?: number[];
}

export interface RealtimeOptions {
  enabled?: boolean;
  url?: string;
  protocol?: "sse" | "websocket";
  autoReconnect?: boolean;
  reconnectDelayMs?: number;
}

export interface RequestOptions {
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  requestId?: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName?: string;
  roles?: string[];
  tenantIds?: string[];
  permissions?: string[];
  featureFlags?: Record<string, boolean>;
}

export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: CurrentUser;
}

export interface EntityRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  filter?: Record<string, unknown>;
  search?: string;
  includeDeleted?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  total?: number;
  nextCursor?: string | null;
}

export interface TenantContext {
  appId: string;
  tenantId?: string;
  organizationId?: string;
  environment?: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  domains?: string[];
  apps?: string[];
  settings?: Record<string, unknown>;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export interface FileUploadResult {
  id: string;
  url?: string;
  name: string;
  contentType?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

export interface FunctionInvokeResult<T = unknown> {
  result: T;
  executionId?: string;
  logs?: string[];
}

export interface AIInvokeRequest {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface AIInvokeResult {
  text: string;
  model?: string;
  usage?: Record<string, unknown>;
}

export interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  templateId?: string;
  data?: Record<string, unknown>;
}

export interface RealtimeEvent<T = unknown> {
  type: string;
  channel?: string;
  tenantId?: string;
  entity?: string;
  action?: string;
  payload: T;
  timestamp?: string;
}

export type RealtimeHandler<T = unknown> = (event: RealtimeEvent<T>) => void;
