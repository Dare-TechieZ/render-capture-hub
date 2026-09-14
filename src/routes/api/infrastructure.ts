import { createFileRoute } from "@tanstack/react-router";
import { getInfrastructure } from "@/lib/responsegrid";

export const Route = createFileRoute("/api/infrastructure")({
  server: { handlers: { GET: ({ request }) => { const url = new URL(request.url); return Response.json(getInfrastructure(Number(url.searchParams.get("latitude")), Number(url.searchParams.get("longitude")))); } } },
});