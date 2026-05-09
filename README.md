# @mysoftwareadmin/sdk

Shared TypeScript SDK for MySoftwareAdmin apps and a Base44-compatible migration layer.

## Install locally while testing

```bash
npm install ../mysoftwareadmin-sdk
```

## Native MySoftwareAdmin SDK

```ts
import { createClient } from "@mysoftwareadmin/sdk";

const msa = createClient({
  appId: "supporttree",
  apiBaseUrl: "https://api.mysoftwareadmin.com",
  tenantId: "demo"
});

const me = await msa.auth.me();
const trees = await msa.entities.collection("DecisionTree").list();
```

## Base44-compatible SDK

This export is designed for apps currently using `@base44/sdk`.

```ts
// before
import { createClient } from "@base44/sdk";

// after
import { createClient } from "@mysoftwareadmin/sdk/base44-compat";

const base44 = createClient({
  appId: "supporttree",
  serverUrl: "https://api.mysoftwareadmin.com",
  appBaseUrl: "https://app.supporttree.app",
  token: localStorage.getItem("base44_access_token") ?? undefined
});

const me = await base44.auth.me();
const rows = await base44.entities.DecisionTree.list("-created_date", 25, 0);
const filtered = await base44.entities.DecisionTree.filter({ status: "active" });
const result = await base44.functions.invoke("evaluateWorkflow", { workflowId: "abc" });
const ai = await base44.integrations.Core.InvokeLLM({ prompt: "Summarize this" });
```

## Base44-compatible surface included

- `auth.me()`
- `auth.updateMe(data)`
- `auth.redirectToLogin(nextUrl?)`
- `auth.loginWithProvider(provider, fromUrl?)`
- `auth.logout(redirectUrl?)`
- `auth.setToken(token, saveToStorage?)`
- `auth.loginViaEmailPassword(email, password, turnstileToken?)`
- `auth.isAuthenticated()`
- `auth.inviteUser(userEmail, role)`
- `auth.register(payload)`
- `auth.verifyOtp({ email, otpCode })`
- `auth.resendOtp(email)`
- `auth.resetPasswordRequest(email)`
- `auth.resetPassword({ resetToken, newPassword })`
- `auth.changePassword({ userId, currentPassword, newPassword })`
- `entities.EntityName.list(sort?, limit?, skip?, fields?)`
- `entities.EntityName.filter(query, sort?, limit?, skip?, fields?)`
- `entities.EntityName.get(id)`
- `entities.EntityName.create(data)`
- `entities.EntityName.update(id, data)`
- `entities.EntityName.delete(id)`
- `entities.EntityName.deleteMany(query)`
- `entities.EntityName.bulkCreate(data)`
- `entities.EntityName.updateMany(query, data)`
- `entities.EntityName.bulkUpdate(data)`
- `entities.EntityName.importEntities(file)`
- `entities.EntityName.subscribe(callback)`
- `functions.invoke(functionName, data)`
- `functions.fetch(path, init?)`
- `integrations.Core.SomeEndpoint(data)`
- `integrations.custom.call(slug, operationId, params)`
- `connectors.getAccessToken(integrationType)`
- `connectors.getConnection(integrationType)`
- `connectors.getCurrentAppUserAccessToken(connectorId)`
- `connectors.getCurrentAppUserConnection(connectorId)`
- `sso.getAccessToken(userid)`
- `users.inviteUser(user_email, role)`
- `appLogs.logUserInApp(pageName)`
- `appLogs.fetchLogs(params?)`
- `appLogs.getStats(params?)`
- `agents.*` basic conversation APIs
- `serviceRole.*` modules when `serviceToken` is supplied
- `Base44Error`
- `auth-utils` helpers: `getAccessToken`, `saveAccessToken`, `removeAccessToken`, `getLoginUrl`

## Backend endpoints your API must implement for true drop-in behavior

The compatibility layer intentionally emits Base44-style routes so you can either proxy them or implement them directly:

```txt
GET    /api/apps/:appId/entities/:entityName
GET    /api/apps/:appId/entities/:entityName?q={json}
GET    /api/apps/:appId/entities/:entityName/:id
POST   /api/apps/:appId/entities/:entityName
PUT    /api/apps/:appId/entities/:entityName/:id
DELETE /api/apps/:appId/entities/:entityName/:id
DELETE /api/apps/:appId/entities/:entityName
POST   /api/apps/:appId/entities/:entityName/bulk
PUT    /api/apps/:appId/entities/:entityName/bulk
PATCH  /api/apps/:appId/entities/:entityName/update-many
POST   /api/apps/:appId/entities/:entityName/import

GET    /api/apps/:appId/entities/User/me
PUT    /api/apps/:appId/entities/User/me
POST   /api/apps/:appId/auth/login
POST   /api/apps/:appId/auth/register
POST   /api/apps/:appId/auth/verify-otp
POST   /api/apps/:appId/auth/resend-otp
POST   /api/apps/:appId/auth/reset-password-request
POST   /api/apps/:appId/auth/reset-password
POST   /api/apps/:appId/auth/change-password
POST   /api/apps/:appId/users/invite-user

POST   /api/apps/:appId/functions/:functionName
POST   /api/apps/:appId/integration-endpoints/Core/:endpointName
POST   /api/apps/:appId/integration-endpoints/installable/:packageName/integration-endpoints/:endpointName
POST   /api/apps/:appId/integrations/custom/:slug/:operationId
```

## Migration tip

Start by changing imports to:

```ts
import { createClient } from "@mysoftwareadmin/sdk/base44-compat";
```

Then point `serverUrl` to your API gateway. Any failures will usually mean your backend has not implemented that Base44-style route yet.
