import type { AIInvokeRequest, AIInvokeResult, EmailRequest } from "../types";
import type { HttpClient } from "../http";

export class AIIntegrationClient {
  constructor(private readonly http: HttpClient) {}
  invokeLLM(request: AIInvokeRequest) { return this.http.post<AIInvokeResult>("/integrations/ai/invoke-llm", request); }
  summarize(text: string, instructions?: string) { return this.http.post<AIInvokeResult>("/integrations/ai/summarize", { text, instructions }); }
  extractJson<T = unknown>(prompt: string, schema?: unknown) { return this.http.post<T>("/integrations/ai/extract-json", { prompt, schema }); }
}

export class EmailIntegrationClient {
  constructor(private readonly http: HttpClient) {}
  send(request: EmailRequest) { return this.http.post<{ id: string; sent: boolean }>("/integrations/email/send", request); }
}

export class IntegrationsClient {
  readonly AI: AIIntegrationClient;
  readonly Email: EmailIntegrationClient;
  readonly Core: AIIntegrationClient;
  constructor(http: HttpClient) {
    this.AI = new AIIntegrationClient(http);
    this.Core = this.AI; // Base44-style alias for InvokeLLM-like usage.
    this.Email = new EmailIntegrationClient(http);
  }
}
