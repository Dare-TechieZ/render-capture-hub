import { createFileRoute } from "@tanstack/react-router";
import { calculatePlan, createGeoJson, type Incident } from "@/lib/responsegrid";

export const Route = createFileRoute("/api/tactical/geojson")({
  server: { handlers: { POST: async ({ request }) => { const payload = (await request.json()) as Incident; return Response.json(createGeoJson(calculatePlan(payload))); } } },
});