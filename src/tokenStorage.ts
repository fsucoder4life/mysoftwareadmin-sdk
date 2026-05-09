import type { TokenStorage, TokenStorageMode } from "./types";

class MemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  getAccessToken() { return this.accessToken; }
  setAccessToken(token: string | null) { this.accessToken = token; }
  getRefreshToken() { return this.refreshToken; }
  setRefreshToken(token: string | null) { this.refreshToken = token; }
}

class WebStorageTokenStorage implements TokenStorage {
  constructor(private readonly storage: Storage, private readonly prefix: string) {}
  getAccessToken() { return this.storage.getItem(`${this.prefix}:accessToken`); }
  setAccessToken(token: string | null) { token ? this.storage.setItem(`${this.prefix}:accessToken`, token) : this.storage.removeItem(`${this.prefix}:accessToken`); }
  getRefreshToken() { return this.storage.getItem(`${this.prefix}:refreshToken`); }
  setRefreshToken(token: string | null) { token ? this.storage.setItem(`${this.prefix}:refreshToken`, token) : this.storage.removeItem(`${this.prefix}:refreshToken`); }
}

export function createTokenStorage(mode: TokenStorageMode | undefined, appId: string, custom?: TokenStorage): TokenStorage {
  if (mode === "custom") {
    if (!custom) throw new Error("customTokenStorage is required when tokenStorage is custom");
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
