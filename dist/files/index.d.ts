import type { FileUploadResult } from "../types";
import type { HttpClient } from "../http";
export declare class FilesClient {
    private readonly http;
    constructor(http: HttpClient);
    upload(file: Blob | File, metadata?: Record<string, unknown>): Promise<FileUploadResult>;
    get(id: string): Promise<FileUploadResult>;
    getDownloadUrl(id: string, expiresInSeconds?: number): Promise<{
        url: string;
    }>;
    getUploadUrl(name: string, contentType?: string, metadata?: Record<string, unknown>): Promise<{
        uploadUrl: string;
        fileId: string;
    }>;
    delete(id: string): Promise<{
        deleted: boolean;
    }>;
    list(query?: Record<string, unknown>): Promise<{
        items: FileUploadResult[];
    }>;
}
//# sourceMappingURL=index.d.ts.map