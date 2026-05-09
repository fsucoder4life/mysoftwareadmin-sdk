import { createClient } from "@mysoftwareadmin/sdk/base44-compat";

export const base44 = createClient({
  appId: "supporttree",
  serverUrl: "https://api.mysoftwareadmin.com",
  appBaseUrl: "https://app.supporttree.app"
});

async function demo() {
  const user = await base44.auth.me();
  const workflows = await base44.entities.SupportWorkflow.list("-updated_date", 10, 0);
  const active = await base44.entities.SupportWorkflow.filter({ status: "active" });
  const result = await base44.functions.invoke("runDecisionTree", { workflowId: "wf_123" });
  const llm = await base44.integrations.Core.InvokeLLM({ prompt: "Create a support summary" });
  return { user, workflows, active, result, llm };
}
