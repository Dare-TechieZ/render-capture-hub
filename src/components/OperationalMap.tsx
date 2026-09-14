import { useEffect, useRef } from "react";
import type { Plan } from "@/lib/responsegrid";

type OperationalMapProps = { plan: Plan };

export function OperationalMap({ plan }: OperationalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void; setView: (center: [number, number], zoom: number) => void } | null>(null);
  const layersRef = useRef<{ clearLayers: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;
      const computed = getComputedStyle(document.documentElement);
      const incidentColor = computed.getPropertyValue("--map-incident").trim();
      const selectedColor = computed.getPropertyValue("--map-selected").trim();
      const availableColor = computed.getPropertyValue("--map-available").trim();
      const mutedColor = computed.getPropertyValue("--map-muted").trim();
      const map = L.map(containerRef.current, { zoomControl: false }).setView([plan.incident.latitude, plan.incident.longitude], 7);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(map);
      const layerGroup = L.layerGroup().addTo(map);
      mapRef.current = map;
      layersRef.current = layerGroup;
      const refresh = () => {
        layerGroup.clearLayers();
        const incidentRadius = Math.sqrt(plan.incident.spillArea / Math.PI) * 1000;
        L.circle([plan.incident.latitude, plan.incident.longitude], { radius: incidentRadius, color: incidentColor, fillColor: incidentColor, fillOpacity: 0.12, weight: 2, dashArray: "5 5" }).addTo(layerGroup);
        const incidentIcon = L.divIcon({ className: "map-pin map-pin-incident", html: "<span>!</span>", iconSize: [34, 34], iconAnchor: [17, 17] });
        L.marker([plan.incident.latitude, plan.incident.longitude], { icon: incidentIcon }).bindTooltip(`INCIDENT · ${plan.incident.severity.toUpperCase()}`).addTo(layerGroup);
        plan.candidates.slice(0, 22).forEach((asset) => {
          const selected = plan.selectedAssets.some((item) => item.assetId === asset.assetId);
          const unavailable = asset.status === "Unavailable";
          const color = selected ? selectedColor : unavailable ? mutedColor : availableColor;
          const icon = L.divIcon({ className: `map-pin ${selected ? "map-pin-selected" : unavailable ? "map-pin-unavailable" : "map-pin-available"}`, html: `<span>${selected ? asset.rank : ""}</span>`, iconSize: [selected ? 27 : 17, selected ? 27 : 17], iconAnchor: [selected ? 13 : 8, selected ? 13 : 8] });
          L.marker([asset.latitude, asset.longitude], { icon }).bindTooltip(`${asset.assetName}<br>${asset.distanceKm} km · ${asset.etaMinutes} min`).addTo(layerGroup);
          if (selected) {
            L.polyline([[asset.latitude, asset.longitude], [plan.incident.latitude, plan.incident.longitude]], { color, weight: 2, opacity: 0.7, dashArray: "4 5" }).addTo(layerGroup);
          }
        });
      };
      refresh();
    });
    return () => {
      cancelled = true;
      layersRef.current?.clearLayers();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [plan]);

  return <div ref={containerRef} className="h-full min-h-[420px] w-full" aria-label="Operational map showing incident, assets, and deployment lines" />;
}