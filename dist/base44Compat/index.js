import { createTokenStorage } from "../tokenStorage";
import { HttpClient } from "../http";
import { createClient as createMsaClient } from "../client";
export class Base44Error extends Error {
    constructor(message, status, code, data, originalError) {
        super(message);
        this.status = status;
        this.code = code;
        this.data = data;
        this.originalError = originalError;
        this.name = "Base44Error";
    }
    toJSON() {
        return { name: this.name, message: this.message, status: this.status, code: this.code, data: this.data };
    }
}
function browserLocalStorage() {
    return typeof window !== "undefined" && "localStorage" in window ? window.localStorage : undefined;
}
function normalizeConfig(config) {
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
    constructor(config, storage, getTenantContext, useServiceToken = false) {
        this.config = config;
        this.storage = storage;
        this.getTenantContext = getTenantContext;
        this.useServiceToken = useServiceToken;
        this.http = new HttpClient(normalizeConfig({ ...config, token: useServiceToken ? config.serviceToken : config.token }), storage, getTenantContext);
    }
    request(method, path, body, options = {}) {
        return this.http.request(method, path, body, options).catch((error) => {
            const status = error?.status;
            const data = error?.details ?? error?.data;
            const code = error?.code;
            const message = error?.message ?? "Request failed";
            const compatError = error instanceof Base44Error ? error : new Base44Error(message, status, code, data, error);
            this.config.options?.onError?.(compatError);
            throw compatError;
        });
    }
    get(path, options) { return this.request("GET", path, undefined, options); }
    post(path, body, options) { return this.request("POST", path, body, options); }
    put(path, body, options) { return this.request("PUT", path, body, options); }
    patch(path, body, options) { return this.request("PATCH", path, body, options); }
    delete(path, bodyOrOptions, maybeOptions) {
        if (bodyOrOptions && typeof bodyOrOptions === "object" && "data" in bodyOrOptions) {
            return this.request("DELETE", path, bodyOrOptions.data, maybeOptions);
        }
        return this.request("DELETE", path, undefined, bodyOrOptions);
    }
}
function makeFormData(data) {
    const hasFile = typeof File !== "undefined" && data && typeof data === "object" && Object.values(data).some((v) => v instanceof File);
    if (data instanceof FormData || hasFile) {
        const form = data instanceof FormData ? data : new FormData();
        if (!(data instanceof FormData)) {
            Object.entries(data).forEach(([key, value]) => {
                if (typeof File !== "undefined" && value instanceof File)
                    form.append(key, value, value.name);
                else if (typeof value === "object" && value !== null)
                    form.append(key, JSON.stringify(value));
                else if (value !== undefined && value !== null)
                    form.append(key, String(value));
            });
        }
        return { body: form, headers: {} };
    }
    return { body: data ?? {}, headers: { "Content-Type": "application/json" } };
}
function createEntityHandler(http, appId, entityName, getSocket) {
    const baseURL = `/apps/${encodeURIComponent(appId)}/entities/${encodeURIComponent(entityName)}`;
    return {
        list(sort, limit, skip, fields) {
            const query = {};
            if (sort)
                query.sort = sort;
            if (limit)
                query.limit = limit;
            if (skip)
                query.skip = skip;
            if (fields)
                query.fields = Array.isArray(fields) ? fields.join(",") : fields;
            return http.get(baseURL, { query });
        },
        filter(q = {}, sort, limit, skip, fields) {
            const query = { q: JSON.stringify(q) };
            if (sort)
                query.sort = sort;
            if (limit)
                query.limit = limit;
            if (skip)
                query.skip = skip;
            if (fields)
                query.fields = Array.isArray(fields) ? fields.join(",") : fields;
            return http.get(baseURL, { query });
        },
        get(id) { return http.get(`${baseURL}/${encodeURIComponent(id)}`); },
        create(data) { return http.post(baseURL, data); },
        update(id, data) { return http.put(`${baseURL}/${encodeURIComponent(id)}`, data); },
        delete(id) { return http.delete(`${baseURL}/${encodeURIComponent(id)}`); },
        deleteMany(query) { return http.delete(baseURL, { data: query }); },
        bulkCreate(data) { return http.post(`${baseURL}/bulk`, data); },
        updateMany(query, data) { return http.patch(`${baseURL}/update-many`, { query, data }); },
        bulkUpdate(data) { return http.put(`${baseURL}/bulk`, data); },
        importEntities(file) {
            const form = new FormData();
            form.append("file", file, file.name);
            return http.post(`${baseURL}/import`, form, { headers: {} });
        },
        subscribe(callback) {
            const socket = getSocket();
            return socket.subscribeToRoom(`entities:${appId}:${entityName}`, {
                update_model: (msg) => {
                    try {
                        const parsed = typeof msg?.data === "string" ? JSON.parse(msg.data) : msg?.data ?? msg;
                        callback({ type: parsed.type, data: parsed.data, id: parsed.id ?? parsed.data?.id, timestamp: parsed.timestamp ?? new Date().toISOString() });
                    }
                    catch (error) {
                        console.error("[MySoftwareAdmin Base44 Compat] Subscription callback error:", error);
                    }
                }
            });
        }
    };
}
function createEntitiesModule(http, appId, getSocket) {
    return new Proxy({}, {
        get(_target, entityName) {
            if (typeof entityName !== "string" || entityName === "then" || entityName.startsWith("_"))
                return undefined;
            return createEntityHandler(http, appId, entityName, getSocket);
        }
    });
}
function createFunctionsModule(http, appId, baseURL) {
    return {
        invoke(functionName, data) {
            if (typeof data === "string")
                throw new Error(`Function ${functionName} must receive an object with named parameters, received: ${data}`);
            const payload = makeFormData(data ?? {});
            return http.post(`/apps/${appId}/functions/${encodeURIComponent(functionName)}`, payload.body, { headers: payload.headers });
        },
        fetch(path, init = {}) {
            const normalizedPath = path.startsWith("/") ? path : `/${path}`;
            const root = (baseURL ?? "").replace(/\/$/, "");
            return fetch(`${root}/functions${normalizedPath}`, init);
        }
    };
}
function createIntegrationsModule(http, appId) {
    const custom = {
        call(slug, operationId, params) {
            if (!slug?.trim())
                throw new Error("Integration slug is required and cannot be empty");
            if (!operationId?.trim())
                throw new Error("Operation ID is required and cannot be empty");
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
            if (typeof packageName !== "string" || packageName === "then" || packageName.startsWith("_"))
                return undefined;
            if (packageName === "custom")
                return custom;
            return new Proxy({}, {
                get(_target2, endpointName) {
                    if (typeof endpointName !== "string" || endpointName === "then" || endpointName.startsWith("_"))
                        return undefined;
                    return (data) => {
                        if (typeof data === "string")
                            throw new Error(`Integration ${endpointName} must receive an object with named parameters, received: ${data}`);
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
function createAuthModule(http, functionsHttp, appId, config, storage) {
    const appBaseUrl = config.appBaseUrl ?? "";
    const serverUrl = (config.serverUrl ?? config.apiBaseUrl?.replace(/\/api\/?$/, "") ?? "").replace(/\/$/, "");
    const setToken = (token, saveToStorage = true) => {
        if (!token)
            return;
        if (saveToStorage)
            void storage.setAccessToken(token);
    };
    return {
        me: () => http.get(`/apps/${appId}/entities/User/me`),
        updateMe: (data) => http.put(`/apps/${appId}/entities/User/me`, data),
        redirectToLogin(nextUrl) {
            if (typeof window === "undefined")
                throw new Error("Login method can only be used in a browser environment");
            const redirectUrl = nextUrl ? new URL(nextUrl, window.location.origin).toString() : window.location.href;
            window.location.href = `${appBaseUrl}/login?from_url=${encodeURIComponent(redirectUrl)}`;
        },
        loginWithProvider(provider, fromUrl = "/") {
            if (typeof window === "undefined")
                throw new Error("Login method can only be used in a browser environment");
            const redirectUrl = new URL(fromUrl, window.location.origin).toString();
            const providerPath = provider === "google" ? "" : `/${provider}`;
            const authPath = provider === "sso" ? `/apps/${appId}/auth/sso/login` : `/apps/auth${providerPath}/login`;
            window.location.href = `${appBaseUrl || serverUrl}/api${authPath}?app_id=${appId}&from_url=${encodeURIComponent(redirectUrl)}`;
        },
        logout(redirectUrl) {
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
        async loginViaEmailPassword(email, password, turnstileToken) {
            const response = await http.post(`/apps/${appId}/auth/login`, { email, password, ...(turnstileToken ? { turnstile_token: turnstileToken } : {}) }, { skipAuth: true });
            if (response?.access_token)
                setToken(response.access_token);
            if (response?.accessToken)
                setToken(response.accessToken);
            return response;
        },
        async isAuthenticated() { try {
            await this.me();
            return true;
        }
        catch {
            return false;
        } },
        inviteUser: (userEmail, role) => http.post(`/apps/${appId}/users/invite-user`, { user_email: userEmail, role }),
        register: (payload) => http.post(`/apps/${appId}/auth/register`, payload, { skipAuth: true }),
        verifyOtp: ({ email, otpCode }) => http.post(`/apps/${appId}/auth/verify-otp`, { email, otp_code: otpCode }, { skipAuth: true }),
        resendOtp: (email) => http.post(`/apps/${appId}/auth/resend-otp`, { email }, { skipAuth: true }),
        resetPasswordRequest: (email) => http.post(`/apps/${appId}/auth/reset-password-request`, { email }, { skipAuth: true }),
        resetPassword: ({ resetToken, newPassword }) => http.post(`/apps/${appId}/auth/reset-password`, { reset_token: resetToken, new_password: newPassword }, { skipAuth: true }),
        changePassword: ({ userId, currentPassword, newPassword }) => http.post(`/apps/${appId}/auth/change-password`, { user_id: userId, current_password: currentPassword, new_password: newPassword })
    };
}
function createConnectorsModule(http, appId) {
    return {
        async getAccessToken(integrationType) { const r = await http.get(`/apps/${appId}/external-auth/tokens/${integrationType}`); return r.access_token; },
        async getConnection(integrationType) { const r = await http.get(`/apps/${appId}/external-auth/tokens/${integrationType}`); return { accessToken: r.access_token, connectionConfig: r.connection_config ?? null }; },
        async getCurrentAppUserAccessToken(connectorId) { const r = await http.get(`/apps/${appId}/app-user-auth/connectors/${connectorId}/token`); return r.access_token; },
        async getCurrentAppUserConnection(connectorId) { const r = await http.get(`/apps/${appId}/app-user-auth/connectors/${connectorId}/token`); return { accessToken: r.access_token, connectionConfig: r.connection_config ?? null }; }
    };
}
function createUserConnectorsModule(http, appId) {
    return {
        async connectAppUser(connectorId) { const r = await http.post(`/apps/${appId}/app-user-auth/connectors/${connectorId}/initiate`); return r.redirect_url; },
        disconnectAppUser(connectorId) { return http.delete(`/apps/${appId}/app-user-auth/connectors/${connectorId}`); }
    };
}
function createSsoModule(http, appId) {
    return { getAccessToken: (userid) => http.get(`/apps/${appId}/auth/sso/accesstoken/${userid}`) };
}
function createUsersModule(http, appId) {
    return { inviteUser: (user_email, role) => http.post(`/apps/${appId}/runtime/users/invite-user`, { user_email, role }) };
}
function createAppLogsModule(http, appId) {
    const baseURL = `/app-logs/${appId}`;
    return {
        logUserInApp: (pageName) => http.post(`${baseURL}/log-user-in-app/${pageName}`),
        fetchLogs: (params = {}) => http.get(baseURL, { query: params }),
        getStats: (params = {}) => http.get(`${baseURL}/stats`, { query: params })
    };
}
function createAgentsModule(http, appId, serverUrl, getSocket, storage) {
    const baseURL = `/apps/${appId}/agents`;
    return {
        getConversations: () => http.get(`${baseURL}/conversations`),
        getConversation: (conversationId) => http.get(`${baseURL}/conversations/${conversationId}`),
        listConversations: (filterParams) => http.get(`${baseURL}/conversations`, { query: filterParams }),
        createConversation: (conversation) => http.post(`${baseURL}/conversations`, conversation),
        addMessage: (conversation, message) => http.post(`${baseURL}/conversations/v2/${conversation.id}/messages`, message),
        subscribeToConversation(conversationId, onUpdate) {
            const socket = getSocket();
            return socket.subscribeToRoom(`/agent-conversations/${conversationId}`, { update_model: ({ data }) => onUpdate(typeof data === "string" ? JSON.parse(data) : data) });
        },
        async getWhatsAppConnectURL(agentName) {
            const token = await storage.getAccessToken();
            const url = `${serverUrl.replace(/\/$/, "")}/api/apps/${appId}/agents/${encodeURIComponent(agentName)}/whatsapp`;
            return token ? `${url}?token=${encodeURIComponent(token)}` : url;
        },
        async getTelegramConnectURL(agentName) {
            const token = await storage.getAccessToken();
            const url = `${serverUrl.replace(/\/$/, "")}/api/apps/${appId}/agents/${encodeURIComponent(agentName)}/telegram`;
            return token ? `${url}?token=${encodeURIComponent(token)}` : url;
        }
    };
}
function createNoopSocket() {
    return {
        subscribeToRoom(room, handlers) {
            console.warn(`[MySoftwareAdmin Base44 Compat] Realtime socket is not connected. Requested room: ${room}`);
            return () => undefined;
        }
    };
}
export function createBase44CompatibleClient(config) {
    if (!config?.appId)
        throw new Error("appId is required");
    let tenantId = config.tenantId;
    const storage = createTokenStorage(config.tokenStorage ?? "localStorage", config.appId, config.customTokenStorage);
    if (config.token)
        void storage.setAccessToken(config.token);
    const getTenantContext = () => ({ appId: config.appId, tenantId, organizationId: config.organizationId, environment: config.environment });
    const http = new Base44Http(config, storage, getTenantContext);
    const serviceHttp = new Base44Http(config, storage, getTenantContext, true);
    const serverUrl = (config.serverUrl ?? config.apiBaseUrl?.replace(/\/api\/?$/, "") ?? "https://api.mysoftwareadmin.com").replace(/\/$/, "");
    let socket;
    const getSocket = () => socket ?? (socket = createNoopSocket());
    const userModules = {
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
        setTenant: (nextTenantId) => { tenantId = nextTenantId; return userModules; },
        msa: createMsaClient(normalizeConfig(config))
    };
    const serviceRole = {
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
export function createPlatformClient(config) {
    return createMsaClient(config);
}
//# sourceMappingURL=index.js.map