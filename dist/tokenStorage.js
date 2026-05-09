class MemoryTokenStorage {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
    }
    getAccessToken() { return this.accessToken; }
    setAccessToken(token) { this.accessToken = token; }
    getRefreshToken() { return this.refreshToken; }
    setRefreshToken(token) { this.refreshToken = token; }
}
class WebStorageTokenStorage {
    constructor(storage, prefix) {
        this.storage = storage;
        this.prefix = prefix;
    }
    getAccessToken() { return this.storage.getItem(`${this.prefix}:accessToken`); }
    setAccessToken(token) { token ? this.storage.setItem(`${this.prefix}:accessToken`, token) : this.storage.removeItem(`${this.prefix}:accessToken`); }
    getRefreshToken() { return this.storage.getItem(`${this.prefix}:refreshToken`); }
    setRefreshToken(token) { token ? this.storage.setItem(`${this.prefix}:refreshToken`, token) : this.storage.removeItem(`${this.prefix}:refreshToken`); }
}
export function createTokenStorage(mode, appId, custom) {
    if (mode === "custom") {
        if (!custom)
            throw new Error("customTokenStorage is required when tokenStorage is custom");
        return custom;
    }
    if (mode === "localStorage" && typeof window !== "undefined" && window.localStorage) {
        return new WebStorageTokenStorage(window.localStorage, `msa:${appId}`);
    }
    if (mode === "sessionStorage" && typeof window !== "undefined" && window.sessionStorage) {
        return new WebStorageTokenStorage(window.sessionStorage, `msa:${appId}`);
    }
    return new MemoryTokenStorage();
}
//# sourceMappingURL=tokenStorage.js.map