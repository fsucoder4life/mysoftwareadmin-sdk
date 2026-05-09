export class AuthClient {
    constructor(http, storage) {
        this.http = http;
        this.storage = storage;
    }
    async loginWithPassword(email, password) {
        const result = await this.http.post("/auth/login", { email, password }, { skipAuth: true });
        await this.storage.setAccessToken(result.accessToken);
        if (result.refreshToken && this.storage.setRefreshToken)
            await this.storage.setRefreshToken(result.refreshToken);
        return result;
    }
    async loginWithToken(accessToken, refreshToken) {
        await this.storage.setAccessToken(accessToken);
        if (refreshToken && this.storage.setRefreshToken)
            await this.storage.setRefreshToken(refreshToken);
    }
    async magicLink(email, redirectUrl) {
        return this.http.post("/auth/magic-link", { email, redirectUrl }, { skipAuth: true });
    }
    async me() {
        return this.http.get("/auth/me");
    }
    async refresh() {
        const refreshToken = this.storage.getRefreshToken ? await this.storage.getRefreshToken() : null;
        const result = await this.http.post("/auth/refresh", { refreshToken }, { skipAuth: true });
        await this.storage.setAccessToken(result.accessToken);
        if (result.refreshToken && this.storage.setRefreshToken)
            await this.storage.setRefreshToken(result.refreshToken);
        return result;
    }
    async logout() {
        await this.http.post("/auth/logout", {}).catch(() => undefined);
        await this.storage.setAccessToken(null);
        if (this.storage.setRefreshToken)
            await this.storage.setRefreshToken(null);
    }
}
//# sourceMappingURL=index.js.map