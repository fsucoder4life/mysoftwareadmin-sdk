export class AIIntegrationClient {
    constructor(http) {
        this.http = http;
    }
    invokeLLM(request) { return this.http.post("/integrations/ai/invoke-llm", request); }
    summarize(text, instructions) { return this.http.post("/integrations/ai/summarize", { text, instructions }); }
    extractJson(prompt, schema) { return this.http.post("/integrations/ai/extract-json", { prompt, schema }); }
}
export class EmailIntegrationClient {
    constructor(http) {
        this.http = http;
    }
    send(request) { return this.http.post("/integrations/email/send", request); }
}
export class IntegrationsClient {
    constructor(http) {
        this.AI = new AIIntegrationClient(http);
        this.Core = this.AI; // Base44-style alias for InvokeLLM-like usage.
        this.Email = new EmailIntegrationClient(http);
    }
}
//# sourceMappingURL=index.js.map