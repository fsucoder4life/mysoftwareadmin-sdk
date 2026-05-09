import { NetworkError, toSdkError } from "./errors";
export class HttpClient {
    constructor(config, tokenStorage, getTenantContext) {
        this.config = config;
        this.tokenStorage = tokenStorage;
        this.getTenantContext = getTenantContext;
    }
    async request(method, path, body, options = {}) {
        const url = this.buildUrl(path, options.query);
        const headers = await this.buildHeaders(options);
        if (body instanceof FormData)
            delete headers["content-type"];
        const retry = this.config.retry ?? {};
        const attempts = retry.attempts ?? 1;
        const retryStatuses = retry.retryStatuses ?? [408, 429, 500, 502, 503, 504];
        let lastError;
        for (let attempt = 0; attempt < attempts; attempt++) {
            try {
                const controller = !options.signal && this.config.timeoutMs ? new AbortController() : undefined;
                const timeout = controller ? setTimeout(() => controller.abort(), this.config.timeoutMs) : undefined;
                const response = await fetch(url, {
                    method,
                    headers,
                    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
                    signal: options.signal ?? controller?.signal
                });
                if (timeout)
                    clearTimeout(timeout);
                const contentType = response.headers.get("content-type") || "";
                const responseBody = contentType.includes("application/json") ? await response.json().catch(() => undefined) : await response.text();
                const requestId = response.headers.get("x-request-id") ?? undefined;
                if (!response.ok) {
                    if (attempt < attempts - 1 && retryStatuses.includes(response.status)) {
                        await this.delay((retry.baseDelayMs ?? 250) * Math.pow(2, attempt));
                        continue;
                    }
                    throw toSdkError(response.status, responseBody, requestId);
                }
                return responseBody;
            }
            catch (err) {
                lastError = err;
                if (attempt < attempts - 1) {
                    await this.delay((retry.baseDelayMs ?? 250) * Math.pow(2, attempt));
                    continue;
                }
            }
        }
        if (lastError instanceof Error && lastError.name !== "TypeError")
            throw lastError;
        throw new NetworkError(lastError instanceof Error ? lastError.message : "Network request failed");
    }
    get(path, options) { return this.request("GET", path, undefined, options); }
    post(path, body, options) { return this.request("POST", path, body, options); }
    put(path, body, options) { return this.request("PUT", path, body, options); }
    patch(path, body, options) { return this.request("PATCH", path, body, options); }
    delete(path, options) { return this.request("DELETE", path, undefined, options); }
    buildUrl(path, query) {
        const base = this.config.apiBaseUrl.replace(/\/$/, "");
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        const url = new URL(`${base}${cleanPath}`);
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value === undefined || value === null)
                    return;
                if (typeof value === "object")
                    url.searchParams.set(key, JSON.stringify(value));
                else
                    url.searchParams.set(key, String(value));
            });
        }
        return url.toString();
    }
    async buildHeaders(options) {
        const context = this.getTenantContext();
        const headers = {
            "accept": "application/json",
            ...(!(options.headers?.["content-type"] || options.headers?.["Content-Type"]) ? { "content-type": "application/json" } : {}),
            "x-msa-app-id": context.appId,
            ...(context.tenantId ? { "x-msa-tenant-id": context.tenantId } : {}),
            ...(context.organizationId ? { "x-msa-organization-id": context.organizationId } : {}),
            ...(context.environment ? { "x-msa-environment": context.environment } : {}),
            ...(this.config.defaultHeaders ?? {}),
            ...(options.headers ?? {})
        };
        if (!options.skipAuth) {
            const token = await this.tokenStorage.getAccessToken();
            if (token)
                headers.authorization = `Bearer ${token}`;
        }
        return headers;
    }
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}
//# sourceMappingURL=http.js.map