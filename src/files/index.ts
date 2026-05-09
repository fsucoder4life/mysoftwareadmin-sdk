import type { FileUploadResult } from "../types";
import type { HttpClient } from "../http";

export class FilesClient {
  constructor(private readonly http: HttpClient) {}

  async upload(file: Blob | File, metadata?: Record<string, unknown>): Promise<FileUploadResult> {
    const form = new FormData();
    form.append("file", file);
    if (metadata) form.append("metadata", JSON.stringify(metadata));
    return this.http.post<FileUploadResult>("/files", form, { headers: { } });
  }

  get(id: string) { return this.http.get<FileUploadResult>(`/files/${encodeURIComponent(id)}`); }
  getDownloadUrl(id: string, expiresInSeconds = 900) { return this.http.post<{ url: string }>(`/files/${encodeURIComponent(id)}/download-url`, { expiresInSeconds }); }
  getUploadUrl(name: string, contentType?: string, metadata?: Record<string, unknown>) { return this.http.post<{ uploadUrl: string; fileId: string }>("/files/upload-url", { name, contentType, metadata }); }
  delete(id: string) { return this.http.delete<{ deleted: boolean }>(`/files/${encodeURIComponent(id)}`); }
  list(query?: Record<string, unknown>) { return this.http.get<{ items: FileUploadResult[] }>("/files", { query }); }
}
