import { createFileRoute } from "@tanstack/react-router";
import { getEnvironment } from "@/lib/responsegrid";

export const Route = createFileRoute("/api/environment")({
  server: { handlers: { GET: ({ request }) => { const url = new URL(request.url); return Response.json(getEnvironment(Number(url.searchParams.get("latitude")), Number(url.searchParams.get("longitude")))); } } },
});