import { createFileRoute } from "@tanstack/react-router";
import { calculatePlan, type Incident } from "@/lib/responsegrid";

export const Route = createFileRoute("/api/tactical/brief")({
  server: { handlers: { POST: async ({ request }) => { const incident = (await request.json()) as Incident; const plan = calculatePlan(incident); return Response.json({ incident: plan.incident, recommendedAssets: plan.selectedAssets.map((asset) => ({ rank: asset.rank, name: asset.assetName, etaMinutes: asset.etaMinutes })), firstEta: plan.summary.firstEta, criticalGap: plan.gap.boomM > 0 ? `${plan.gap.boomM} m containment boom` : plan.gap.recoveryTph > 0 ? `${plan.gap.recoveryTph} t/h recovery` : "No critical resource gap", environment: plan.environment, action: plan.gap.status === "Sufficient" ? "Deploy ranked assets in order and maintain perimeter monitoring." : "Deploy ranked assets in order and source the identified resource gap before expansion." }); } } },
});