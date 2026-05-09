import { createClient } from "../src";

const msa = createClient({
  appId: "supporttree",
  tenantId: "demo-company",
  apiBaseUrl: "https://api.mysoftwareadmin.com",
  tokenStorage: "localStorage",
  retry: { attempts: 3 },
  realtime: { enabled: true }
});

async function main() {
  await msa.auth.loginWithPassword("admin@example.com", "change-me");

  const Workflow = msa.entities.collection("SupportWorkflow");
  const workflow = await Workflow.create({
    name: "Internet Down",
    description: "Guided troubleshooting for store internet outages"
  });

  const result = await msa.functions.invoke("evaluateWorkflow", {
    workflowId: workflow.id,
    answers: { modemLights: "blinking", firewallOnline: false }
  });

  console.log(result.result);
}

main().catch(console.error);
