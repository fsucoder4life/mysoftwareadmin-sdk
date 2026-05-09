import { createBase44CompatibleClient } from "../src/base44Compat";

const base44 = createBase44CompatibleClient({
  appId: "supporttree",
  tenantId: "demo-company",
  apiBaseUrl: "https://api.mysoftwareadmin.com",
  tokenStorage: "localStorage"
});

async function main() {
  const me = await base44.auth.me();
  const workflows = await base44.entities.SupportWorkflow.list();
  const ai = await base44.integrations.Core.InvokeLLM({
    prompt: "Create a short support workflow summary."
  });

  console.log({ me, workflows, ai });
}

main().catch(console.error);
