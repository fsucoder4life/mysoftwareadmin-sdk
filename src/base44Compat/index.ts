import { createTokenStorage } from "../tokenStorage";
import { HttpClient } from "../http";
import type { MySoftwareAdminClientConfig, RequestOptions, TokenStorage, TenantContext } from "../types";
import { MySoftwareAdminClient, createClient as createMsaClient } from "../client";

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
  options?: { onError?: (error: unknown) => void };
  tenantId?: string;
  organizationId?: string;
  environment?: string;
  tokenStorage?: MySoftwareAdminClientConfig["tokenStorage"];
  customTokenStorage?: TokenStorage;
  timeoutMs?: number;
  retry?: MySoftwareAdminClientConfig["retry"];
}

export class Base44Error extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly data?: unknown,
    readonly originalError?: unknown
  ) {
    super(message);
    this.name = "Base44Error";
  }

  toJSON() {
    return { name: this.name, message: this.message, status: this.status, code: this.code, data: this.data };
  }
}

type AnyObject = Record<string, any>;

function browserLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window ? window.localStorage : undefined;
}

function normalizeConfig(config: Base44CompatibleClientConfig): MySoftwareAdminClientConfig {
  const serverUrl = (config.serverUrl ?? "https://api.mysoftwareadmin.com").replace(/\/$/, "");
  const apiBaseUrl = (config.apiBaseUrl ?? `${serverUrl}/api`).replace(/\/$/, "");
  return {
    appId: config.appId,
    apiBaseUrl,
    tenantId: config.tenantId,
    organizationId: config.organizationId,
    environment: config.environment,
    tokenStorage: config.tokenStorage ?? "localStorage",
    customTokenStorage: config.customTokenStorage,
    accessToken: config.token,
    defaultHeaders: {
      ...(config.headers ?? {}),
      "X-App-Id": String(config.appId),
      ...(config.functionsVersion ? { "Base44-Functions-Version": config.functionsVersion } : {})
    },
    timeoutMs: config.timeoutMs,
    retry: config.retry
  };
}

class Base44Http {
  private readonly http: HttpClient;
  constructor(
    private readonly config: Base44CompatibleClientConfig,
    private readonly storage: TokenStorage,
    private readonly getTenantContext: () => TenantContext,
    private readonly useServiceToken = false
  ) {
    this.http = new HttpClient(normalizeConfig({ ...config, token: useServiceToken ? config.serviceToken : config.token }), storage, getTenantContext);
  }

  request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}) {
    return this.http.request<T>(method, path, body, options).catch((error) => {
      const status = (error as any)?.status;
      const data = (error as any)?.details ?? (error as any)?.data;
      const code = (error as any)?.code;
      const message = (error as any)?.message ?? "Request failed";
      const compatError = error instanceof Base44Error ? error : new Base44Error(message, status, code, data, error);
      this.config.options?.onError?.(compatError);
      throw compatError;
    });
  }

  get<T>(path: string, options?: RequestOptions) { return this.request<T>("GET", path, undefined, options); }
  post<T>(path: string, body?: unknown, options?: RequestOptions) { return this.request<T>("POST", path, body, options); }
  put<T>(path: string, body?: unknown, options?: RequestOptions) { return this.request<T>("PUT", path, body, options); }
  patch<T>(path: string, body?: unknown, options?: RequestOptions) { return this.request<T>("PATCH", path, body, options); }
  delete<T>(path: string, bodyOrOptions?: unknown | RequestOptions, maybeOptions?: RequestOptions) {
    if (bodyOrOptions && typeof bodyOrOptions === "object" && "data" in (bodyOrOptions as AnyObject)) {
      return this.request<T>("DELETE", path, (bodyOrOptions as AnyObject).data, maybeOptions);
    }
    return this.request<T>("DELETE", path, undefined, bodyOrOptions as RequestOptions | undefined);
  }
}

function makeFormData(data: any): { body: any; headers: Record<string, string> } {
  const hasFile = typeof File !== "undefined" && data && typeof data === "object" && Object.values(data).some((v) => v instanceof File);
  if (data instanceof FormData || hasFile) {
    const form = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData)) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof File !== "undefined" && value instanceof File) form.append(key, value, value.name);
        else if (typeof value === "object" && value !== null) form.append(key, JSON.stringify(value));
        else if (value !== undefined && value !== null) form.append(key, String(value));
      });
    }
    return { body: form, headers: {} };
  }
  return { body: data ?? {}, headers: { "Content-Type": "application/json" } };
}

function createEntityHandler(http: Base44Http, appId: string, entityName: string, getSocket: () => any) {
  const baseURL = `/apps/${encodeURIComponent(appId)}/entities/${encodeURIComponent(entityName)}`;
  return {
    list(sort?: string, limit?: number, skip?: number, fields?: string[] | string) {
      const query: AnyObject = {};
      if (sort) query.sort = sort;
      if (limit) query.limit = limit;
      if (skip) query.skip = skip;
      if (fields) query.fields = Array.isArray(fields) ? fields.join(",") : fields;
      return http.get(baseURL, { query });
    },
    filter(q: AnyObject = {}, sort?: string, limit?: number, skip?: number, fields?: string[] | string) {
      const query: AnyObject = { q: JSON.stringify(q) };
      if (sort) query.sort = sort;
      if (limit) query.limit = limit;
      if (skip) query.skip = skip;
      if (fields) query.fields = Array.isArray(fields) ? fields.join(",") : fields;
      return http.get(baseURL, { query });
    },
    get(id: string) { return http.get(`${baseURL}/${encodeURIComponent(id)}`); },
    create(data: AnyObject) { return http.post(baseURL, data); },
    update(id: string, data: AnyObject) { return http.put(`${baseURL}/${encodeURIComponent(id)}`, data); },
    delete(id: string) { return http.delete(`${baseURL}/${encodeURIComponent(id)}`); },
    deleteMany(query: AnyObject) { return http.delete(baseURL, { data: query }); },
    bulkCreate(data: AnyObject[]) { return http.post(`${baseURL}/bulk`, data); },
    updateMany(query: AnyObject, data: AnyObject) { return http.patch(`${baseURL}/update-many`, { query, data }); },
    bulkUpdate(data: AnyObject[]) { return http.put(`${baseURL}/bulk`, data); },
    importEntities(file: File) {
      const form = new FormData();
      form.append("file", file, file.name);
      return http.post(`${baseURL}/import`, form, { headers: {} });
    },
    subscribe(callback: (event: any) => void) {
      const socket = getSocket();
      return socket.subscribeToRoom(`entities:${appId}:${entityName}`, {
        update_model: (msg: any) => {
          try {
            const parsed = typeof msg?.data === "string" ? JSON.parse(msg.data) : msg?.data ?? msg;
            callback({ type: parsed.type, data: parsed.data, id: parsed.id ?? parsed.data?.id, timestamp: parsed.timestamp ?? new Date().toISOString() });
          } catch (error) {
            console.error("[MySoftwareAdmin Base44 Compat] Subscription callback error:", error);
          }
        }
      });
    }
  };
}

function createEntitiesModule(http: Base44Http, appId: string, getSocket: () => any) {
  return new Proxy({}, {
    get(_target, entityName) {
      if (typeof entityName !== "string" || entityName === "then" || entityName.startsWith("_")) return undefined;
      return createEntityHandler(http, appId, entityName, getSocket);
    }
  });
}

function createFunctionsModule(http: Base44Http, appId: string, baseURL?: string) {
  return {
    invoke(functionName: string, data?: AnyObject) {
      if (typeof data === "string") throw new Error(`Function ${functionName} must receive an object with named parameters, received: ${data}`);
      const payload = makeFormData(data ?? {});
      return http.post(`/apps/${appId}/functions/${encodeURIComponent(functionName)}`, payload.body, { headers: payload.headers });
    },
    fetch(path: string, init: RequestInit = {}) {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const root = (baseURL ?? "").replace(/\/$/, "");
      return fetch(`${root}/functions${normalizedPath}`, init);
    }
  };
}

function createIntegrationsModule(http: Base44Http, appId: string) {
  const custom = {
    call(slug: string, operationId: string, params?: AnyObject) {
      if (!slug?.trim()) throw new Error("Integration slug is required and cannot be empty");
      if (!operationId?.trim()) throw new Error("Operation ID is required and cannot be empty");
      const { pathParams, queryParams, ...rest } = params ?? {};
      return http.post(`/apps/${appId}/integrations/custom/${slug}/${operationId}`, {
        ...rest,
        ...(pathParams ? { path_params: pathParams } : {}),
        ...(queryParams ? { query_params: queryParams } : {})
      });
    }
  };
  return new Proxy({}, {
    get(_target, packageName) {
      if (typeof packageName !== "string" || packageName === "then" || packageName.startsWith("_")) return undefined;
      if (packageName === "custom") return custom;
      return new Proxy({}, {
        get(_target2, endpointName) {
          if (typeof endpointName !== "string" || endpointName === "then" || endpointName.startsWith("_")) return undefined;
          return (data?: AnyObject) => {
            if (typeof data === "string") throw new Error(`Integration ${endpointName} must receive an object with named parameters, received: ${data}`);
            const payload = makeFormData(data ?? {});
            const path = packageName === "Core"
              ? `/apps/${appId}/integration-endpoints/Core/${endpointName}`
              : `/apps/${appId}/integration-endpoints/installable/${packageName}/integration-endpoints/${endpointName}`;
            return http.post(path, payload.body, { headers: payload.headers });
          };
        }
      });
    }
  });
}

function createAuthModule(http: Base44Http, functionsHttp: Base44Http, appId: string, config: Base44CompatibleClientConfig, storage: TokenStorage) {
  const appBaseUrl = config.appBaseUrl ?? "";
  const serverUrl = (config.serverUrl ?? config.apiBaseUrl?.replace(/\/api\/?$/, "") ?? "").replace(/\/$/, "");
  const setToken = (token?: string, saveToStorage = true) => {
    if (!token) return;
    if (saveToStorage) void storage.setAccessToken(token);
  };
  return {
    me: () => http.get(`/apps/${appId}/entities/User/me`),
    updateMe: (data: AnyObject) => http.put(`/apps/${appId}/entities/User/me`, data),
    redirectToLogin(nextUrl?: string) {
      if (typeof window === "undefined") throw new Error("Login method can only be used in a browser environment");
      const redirectUrl = nextUrl ? new URL(nextUrl, window.location.origin).toString() : window.location.href;
      window.location.href = `${appBaseUrl}/login?from_url=${encodeURIComponent(redirectUrl)}`;
    },
    loginWithProvider(provider: string, fromUrl = "/") {
      if (typeof window === "undefined") throw new Error("Login method can only be used in a browser environment");
      const redirectUrl = new URL(fromUrl, window.location.origin).toString();
      const providerPath = provider === "google" ? "" : `/${provider}`;
      const authPath = provider === "sso" ? `/apps/${appId}/auth/sso/login` : `/apps/auth${providerPath}/login`;
      window.location.href = `${appBaseUrl || serverUrl}/api${authPath}?app_id=${appId}&from_url=${encodeURIComponent(redirectUrl)}`;
    },
    logout(redirectUrl?: string) {
      void storage.setAccessToken(null);
      const ls = browserLocalStorage();
      ls?.removeItem("base44_access_token");
      ls?.removeItem("token");
      if (typeof window !== "undefined") {
        const fromUrl = redirectUrl || window.location.href;
        window.location.href = `${appBaseUrl || serverUrl}/api/apps/auth/logout?from_url=${encodeURIComponent(fromUrl)}`;
      }
    },
    setToken,
    async loginViaEmailPassword(email: string, password: string, turnstileToken?: string) {
      const response: any = await http.post(`/apps/${appId}/auth/login`, { email, password, ...(turnstileToken ? { turnstile_token: turnstileToken } : {}) }, { skipAuth: true });
      if (response?.access_token) setToken(response.access_token);
      if (response?.accessToken) setToken(response.accessToken);
      return response;
    },
    async isAuthenticated() { try { await this.me(); return true; } catch { return false; } },
    inviteUser: (userEmail: string, role: string) => http.post(`/apps/${appId}/users/invite-user`, { user_email: userEmail, role }),
    register: (payload: AnyObject) => http.post(`/apps/${appId}/auth/register`, payload, { skipAuth: true }),
    verifyOtp: ({ email, otpCode }: { email: string; otpCode: string }) => http.post(`/apps/${appId}/auth/verify-otp`, { email, otp_code: otpCode }, { skipAuth: true }),
    resendOtp: (email: string) => http.post(`/apps/${appId}/auth/resend-otp`, { email }, { skipAuth: true }),
    resetPasswordRequest: (email: string) => http.post(`/apps/${appId}/auth/reset-password-request`, { email }, { skipAuth: true }),
    resetPassword: ({ resetToken, newPassword }: { resetToken: string; newPassword: string }) => http.post(`/apps/${appId}/auth/reset-password`, { reset_token: resetToken, new_password: newPassword }, { skipAuth: true }),
    changePassword: ({ userId, currentPassword, newPassword }: { userId: string; currentPassword: string; newPassword: string }) => http.post(`/apps/${appId}/auth/change-password`, { user_id: userId, current_password: currentPassword, new_password: newPassword })
  };
}

function createConnectorsModule(http: Base44Http, appId: string) {
  return {
    async getAccessToken(integrationType: string) { const r: any = await http.get(`/apps/${appId}/external-auth/tokens/${integrationType}`); return r.access_token; },
    async getConnection(integrationType: string) { const r: any = await http.get(`/apps/${appId}/external-auth/tokens/${integrationType}`); return { accessToken: r.access_token, connectionConfig: r.connection_config ?? null }; },
    async getCurrentAppUserAccessToken(connectorId: string) { const r: any = await http.get(`/apps/${appId}/app-user-auth/connectors/${connectorId}/token`); return r.access_token; },
    async getCurrentAppUserConnection(connectorId: string) { const r: any = await http.get(`/apps/${appId}/app-user-auth/connectors/${connectorId}/token`); return { accessToken: r.access_token, connectionConfig: r.connection_config ?? null }; }
  };
}

function createUserConnectorsModule(http: Base44Http, appId: string) {
  return {
    async connectAppUser(connectorId: string) { const r: any = await http.post(`/apps/${appId}/app-user-auth/connectors/${connectorId}/initiate`); return r.redirect_url; },
    disconnectAppUser(connectorId: string) { return http.delete(`/apps/${appId}/app-user-auth/connectors/${connectorId}`); }
  };
}

function createSsoModule(http: Base44Http, appId: string) {
  return { getAccessToken: (userid: string) => http.get(`/apps/${appId}/auth/sso/accesstoken/${userid}`) };
}

function createUsersModule(http: Base44Http, appId: string) {
  return { inviteUser: (user_email: string, role: "user" | "admin") => http.post(`/apps/${appId}/runtime/users/invite-user`, { user_email, role }) };
}

function createAppLogsModule(http: Base44Http, appId: string) {
  const baseURL = `/app-logs/${appId}`;
  return {
    logUserInApp: (pageName: string) => http.post(`${baseURL}/log-user-in-app/${pageName}`),
    fetchLogs: (params: AnyObject = {}) => http.get(baseURL, { query: params }),
    getStats: (params: AnyObject = {}) => http.get(`${baseURL}/stats`, { query: params })
  };
}

function createAgentsModule(http: Base44Http, appId: string, serverUrl: string, getSocket: () => any, storage: TokenStorage) {
  const baseURL = `/apps/${appId}/agents`;
  return {
    getConversations: () => http.get(`${baseURL}/conversations`),
    getConversation: (conversationId: string) => http.get(`${baseURL}/conversations/${conversationId}`),
    listConversations: (filterParams?: AnyObject) => http.get(`${baseURL}/conversations`, { query: filterParams }),
    createConversation: (conversation: AnyObject) => http.post(`${baseURL}/conversations`, conversation),
    addMessage: (conversation: AnyObject, message: AnyObject) => http.post(`${baseURL}/conversations/v2/${conversation.id}/messages`, message),
    subscribeToConversation(conversationId: string, onUpdate: (conversation: any) => void) {
      const socket = getSocket();
      return socket.subscribeToRoom(`/agent-conversations/${conversationId}`, { update_model: ({ data }: any) => onUpdate(typeof data === "string" ? JSON.parse(data) : data) });
    },
    async getWhatsAppConnectURL(agentName: string) {
      const token = await storage.getAccessToken();
      const url = `${serverUrl.replace(/\/$/, "")}/api/apps/${appId}/agents/${encodeURIComponent(agentName)}/whatsapp`;
      return token ? `${url}?token=${encodeURIComponent(token)}` : url;
    },
    async getTelegramConnectURL(agentName: string) {
      const token = await storage.getAccessToken();
      const url = `${serverUrl.replace(/\/$/, "")}/api/apps/${appId}/agents/${encodeURIComponent(agentName)}/telegram`;
      return token ? `${url}?token=${encodeURIComponent(token)}` : url;
    }
  };
}

function createNoopSocket() {
  return {
    subscribeToRoom(room: string, handlers: AnyObject) {
      console.warn(`[MySoftwareAdmin Base44 Compat] Realtime socket is not connected. Requested room: ${room}`);
      return () => undefined;
    }
  };
}

export function createBase44CompatibleClient(config: Base44CompatibleClientConfig) {
  if (!config?.appId) throw new Error("appId is required");
  let tenantId = config.tenantId;
  const storage = createTokenStorage(config.tokenStorage ?? "localStorage", config.appId, config.customTokenStorage);
  if (config.token) void storage.setAccessToken(config.token);
  const getTenantContext = () => ({ appId: config.appId, tenantId, organizationId: config.organizationId, environment: config.environment });
  const http = new Base44Http(config, storage, getTenantContext);
  const serviceHttp = new Base44Http(config, storage, getTenantContext, true);
  const serverUrl = (config.serverUrl ?? config.apiBaseUrl?.replace(/\/api\/?$/, "") ?? "https://api.mysoftwareadmin.com").replace(/\/$/, "");
  let socket: any;
  const getSocket = () => socket ?? (socket = createNoopSocket());

  const userModules: AnyObject = {
    entities: createEntitiesModule(http, config.appId, getSocket),
    integrations: createIntegrationsModule(http, config.appId),
    connectors: createUserConnectorsModule(http, config.appId),
    auth: createAuthModule(http, http, config.appId, config, storage),
    functions: createFunctionsModule(http, config.appId, serverUrl),
    sso: createSsoModule(http, config.appId),
    agents: createAgentsModule(http, config.appId, serverUrl, getSocket, storage),
    appLogs: createAppLogsModule(http, config.appId),
    users: createUsersModule(http, config.appId),
    raw: http,
    setTenant: (nextTenantId?: string) => { tenantId = nextTenantId; return userModules; },
    msa: createMsaClient(normalizeConfig(config))
  };

  const serviceRole: AnyObject = {
    entities: createEntitiesModule(serviceHttp, config.appId, getSocket),
    integrations: createIntegrationsModule(serviceHttp, config.appId),
    connectors: createConnectorsModule(serviceHttp, config.appId),
    functions: createFunctionsModule(serviceHttp, config.appId, serverUrl),
    sso: createSsoModule(serviceHttp, config.appId),
    agents: createAgentsModule(serviceHttp, config.appId, serverUrl, getSocket, storage),
    appLogs: createAppLogsModule(serviceHttp, config.appId),
    users: createUsersModule(serviceHttp, config.appId),
    raw: serviceHttp
  };

  userModules.serviceRole = serviceRole;
  return userModules;
}

export const createClient = createBase44CompatibleClient;
export const createClientCompat = createBase44CompatibleClient;

export function createPlatformClient(config: MySoftwareAdminClientConfig): MySoftwareAdminClient {
  return createMsaClient(config);
}
