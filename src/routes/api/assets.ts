import { createFileRoute } from "@tanstack/react-router";
import { assets } from "@/lib/responsegrid";

export const Route = createFileRoute("/api/assets")({
  server: { handlers: { GET: () => Response.json({ assets, count: assets.length, source: "Operational Resource Register" }) } },
});