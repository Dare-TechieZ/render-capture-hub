import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Plan } from "@/lib/responsegrid";

type OperationalMapProps = {
  plan: Plan;
};

type LeafletMap = {
  remove: () => void;
  invalidateSize: (options?: {
    animate?: boolean;
    pan?: boolean;
  }) => LeafletMap;
};

type LeafletLayerGroup = {
  clearLayers: () => void;
};

export function OperationalMap({ plan }: OperationalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LeafletLayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const initializeMap = async () => {
      const { default: L } = await import("leaflet");

      if (cancelled || !containerRef.current) {
        return;
      }

      const container = containerRef.current;

      // Prevent duplicate Leaflet instances.
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }

      const computed = getComputedStyle(document.documentElement);

      const incidentColor =
        computed.getPropertyValue("--map-incident").trim() || "#9f3d32";

      const selectedColor =
        computed.getPropertyValue("--map-selected").trim() || "#173f68";

      const availableColor =
        computed.getPropertyValue("--map-available").trim() || "#2f7d4b";

      const mutedColor =
        computed.getPropertyValue("--map-muted").trim() || "#64748b";

      const map = L.map(container, {
        zoomControl: false,
        preferCanvas: true,
      }).setView(
        [plan.incident.latitude, plan.incident.longitude],
        7,
      );

      mapRef.current = map;

      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
          crossOrigin: true,
        },
      ).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layersRef.current = layerGroup;

      layerGroup.clearLayers();

      /*
       * Incident area
       */
      const incidentRadius = Math.max(
        500,
        Math.sqrt(
          Math.max(plan.incident.spillArea, 0.1) / Math.PI,
        ) * 1000,
      );

      L.circle(
        [
          plan.incident.latitude,
          plan.incident.longitude,
        ],
        {
          radius: incidentRadius,
          color: incidentColor,
          fillColor: incidentColor,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "5 5",
        },
      ).addTo(layerGroup);

      /*
       * Incident marker
       */
      const incidentIcon = L.divIcon({
        className: "map-pin map-pin-incident",
        html: "<span>!</span>",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker(
        [
          plan.incident.latitude,
          plan.incident.longitude,
        ],
        {
          icon: incidentIcon,
        },
      )
        .bindTooltip(
          `INCIDENT · ${plan.incident.severity.toUpperCase()}<br>${plan.incident.latitude.toFixed(
            4,
          )}, ${plan.incident.longitude.toFixed(4)}`,
        )
        .addTo(layerGroup);

      /*
       * Asset markers
       */
      plan.candidates.slice(0, 22).forEach((asset) => {
        const selectedAsset = plan.selectedAssets.find(
          (item) => item.assetId === asset.assetId,
        );

        const selected = Boolean(selectedAsset);
        const unavailable = asset.status === "Unavailable";

        const color = selected
          ? selectedColor
          : unavailable
            ? mutedColor
            : availableColor;

        const size = selected ? 27 : 17;
        const anchor = selected ? 13 : 8;

        const icon = L.divIcon({
          className: `map-pin ${
            selected
              ? "map-pin-selected"
              : unavailable
                ? "map-pin-unavailable"
                : "map-pin-available"
          }`,
          html: `<span>${selectedAsset?.rank ?? ""}</span>`,
          iconSize: [size, size],
          iconAnchor: [anchor, anchor],
        });

        L.marker(
          [
            asset.latitude,
            asset.longitude,
          ],
          {
            icon,
          },
        )
          .bindTooltip(
            `${asset.assetName}<br>${asset.distanceKm} km · ${asset.etaMinutes} min`,
          )
          .addTo(layerGroup);

        /*
         * Connection from selected asset to incident.
         */
        if (selected) {
          L.polyline(
            [
              [
                asset.latitude,
                asset.longitude,
              ],
              [
                plan.incident.latitude,
                plan.incident.longitude,
              ],
            ],
            {
              color,
              weight: 2,
              opacity: 0.7,
              dashArray: "4 5",
            },
          ).addTo(layerGroup);
        }
      });

      /*
       * Leaflet can calculate an incorrect map size when its container
       * has just been created by React/CSS. Force recalculation.
       */
      map.invalidateSize({
        animate: false,
        pan: false,
      });

      requestAnimationFrame(() => {
        if (!cancelled) {
          map.invalidateSize({
            animate: false,
            pan: false,
          });
        }
      });

      /*
       * Keep the map correct if the surrounding layout changes size.
       */
      resizeObserver = new ResizeObserver(() => {
        if (!cancelled) {
          map.invalidateSize({
            animate: false,
            pan: false,
          });
        }
      });

      resizeObserver.observe(container);
    };

    void initializeMap();

    return () => {
      cancelled = true;

      resizeObserver?.disconnect();
      resizeObserver = null;

      layersRef.current?.clearLayers();
      layersRef.current = null;

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [plan]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[420px] w-full"
      aria-label="Operational map showing incident, assets, and deployment lines"
    />
  );
}
