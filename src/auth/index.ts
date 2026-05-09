import type { AuthResult, CurrentUser, TokenStorage } from "../types";
import type { HttpClient } from "../http";

export class AuthClient {
  constructor(private readonly http: HttpClient, private readonly storage: TokenStorage) {}

  async loginWithPassword(email: string, password: string): Promise<AuthResult> {
    const result = await this.http.post<AuthResult>("/auth/login", { email, password }, { skipAuth: true });
    await this.storage.setAccessToken(result.accessToken);
    if (result.refreshToken && this.storage.setRefreshToken) await this.storage.setRefreshToken(result.refreshToken);
    return result;
  }

  async loginWithToken(accessToken: string, refreshToken?: string): Promise<void> {
    await this.storage.setAccessToken(accessToken);
    if (refreshToken && this.storage.setRefreshToken) await this.storage.setRefreshToken(refreshToken);
  }

  async magicLink(email: string, redirectUrl?: string): Promise<{ sent: boolean }> {
    return this.http.post("/auth/magic-link", { email, redirectUrl }, { skipAuth: true });
  }

  async me(): Promise<CurrentUser> {
    return this.http.get<CurrentUser>("/auth/me");
  }

  async refresh(): Promise<AuthResult> {
    const refreshToken = this.storage.getRefreshToken ? await this.storage.getRefreshToken() : null;
    const result = await this.http.post<AuthResult>("/auth/refresh", { refreshToken }, { skipAuth: true });
    await this.storage.setAccessToken(result.accessToken);
    if (result.refreshToken && this.storage.setRefreshToken) await this.storage.setRefreshToken(result.refreshToken);
    return result;
  }

  async logout(): Promise<void> {
    await this.http.post("/auth/logout", {}).catch(() => undefined);
    await this.storage.setAccessToken(null);
    if (this.storage.setRefreshToken) await this.storage.setRefreshToken(null);
  }
}
