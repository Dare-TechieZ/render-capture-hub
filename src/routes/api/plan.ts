import { createFileRoute } from "@tanstack/react-router";
import { calculatePlan, type Incident } from "@/lib/responsegrid";

export const Route = createFileRoute("/api/plan")({
  server: { handlers: { POST: async ({ request }) => {
    const payload = (await request.json()) as Partial<Incident>;
    const incident: Incident = {
      latitude: Number(payload.latitude), longitude: Number(payload.longitude), spillArea: Number(payload.spillArea), severity: payload.severity ?? "High", maxAssets: Number(payload.maxAssets),
    };
    if (![incident.latitude, incident.longitude, incident.spillArea, incident.maxAssets].every(Number.isFinite) || incident.spillArea <= 0 || incident.maxAssets < 1) return Response.json({ error: "Invalid incident parameters" }, { status: 400 });
    return Response.json(calculatePlan(incident));
  } } },
});