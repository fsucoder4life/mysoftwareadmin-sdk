export function saveAccessToken(token, options = {}) {
    const storageKey = options.storageKey ?? "base44_access_token";
    if (typeof window === "undefined" || !window.localStorage || !token)
        return false;
    try {
        window.localStorage.setItem(storageKey, token);
        window.localStorage.setItem("token", token);
        return true;
    }
    catch {
        return false;
    }
}
export function getAccessToken(options = {}) {
    const { storageKey = "base44_access_token", paramName = "access_token", saveToStorage = true, removeFromUrl = true } = options;
    if (typeof window !== "undefined" && window.location) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get(paramName);
        if (token) {
            if (saveToStorage)
                saveAccessToken(token, { storageKey });
            if (removeFromUrl) {
                params.delete(paramName);
                const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
                window.history.replaceState({}, document.title, nextUrl);
            }
            return token;
        }
    }
    try {
        return typeof window !== "undefined" ? window.localStorage?.getItem(storageKey) : null;
    }
    catch {
        return null;
    }
}
export function removeAccessToken(options = {}) {
    const storageKey = options.storageKey ?? "base44_access_token";
    if (typeof window === "undefined" || !window.localStorage)
        return false;
    try {
        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem("token");
        return true;
    }
    catch {
        return false;
    }
}
export function getLoginUrl(nextUrl, options) {
    const { serverUrl, appId, loginPath = "/login" } = options;
    if (!serverUrl || !appId)
        throw new Error("serverUrl and appId are required to construct login URL");
    const redirectUrl = nextUrl ?? (typeof window !== "undefined" ? window.location.href : "");
    return `${serverUrl}${loginPath}?from_url=${encodeURIComponent(redirectUrl)}&app_id=${encodeURIComponent(appId)}`;
}
//# sourceMappingURL=authUtils.js.map