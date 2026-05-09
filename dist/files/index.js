export class FilesClient {
    constructor(http) {
        this.http = http;
    }
    async upload(file, metadata) {
        const form = new FormData();
        form.append("file", file);
        if (metadata)
            form.append("metadata", JSON.stringify(metadata));
        return this.http.post("/files", form, { headers: {} });
    }
    get(id) { return this.http.get(`/files/${encodeURIComponent(id)}`); }
    getDownloadUrl(id, expiresInSeconds = 900) { return this.http.post(`/files/${encodeURIComponent(id)}/download-url`, { expiresInSeconds }); }
    getUploadUrl(name, contentType, metadata) { return this.http.post("/files/upload-url", { name, contentType, metadata }); }
    delete(id) { return this.http.delete(`/files/${encodeURIComponent(id)}`); }
    list(query) { return this.http.get("/files", { query }); }
}
//# sourceMappingURL=index.js.map