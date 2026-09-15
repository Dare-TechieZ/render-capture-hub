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
  fitBounds: (bounds: unknown, options?: unknown) => LeafletMap;
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

      if (cancelled || !containerRef.current) return;

      const container = containerRef.current;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }

      const computed = getComputedStyle(document.documentElement);

      const incidentColor =
        computed.getPropertyValue("--map-incident").trim() || "#b42318";

      const selectedColor =
        computed.getPropertyValue("--map-selected").trim() || "#173f68";

      const availableColor =
        computed.getPropertyValue("--map-available").trim() || "#2f7d4b";

      const mutedColor =
        computed.getPropertyValue("--map-muted").trim() || "#64748b";

      const criticalColor = "#b42318";
      const highRiskColor = "#d97706";
      const watchColor = "#ca8a04";

      const map = L.map(container, {
        zoomControl: false,
        preferCanvas: true,
      }).setView(
        [plan.incident.latitude, plan.incident.longitude],
        7,
      ) as unknown as LeafletMap;

      mapRef.current = map;

      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map as any);

      /*
       * Base map.
       */
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
          crossOrigin: true,
        },
      ).addTo(map as any);

      const layerGroup = L.layerGroup().addTo(map as any);
      layersRef.current = layerGroup;

      /*
       * ---------------------------------------------------------
       * 1. AI RED-FLAG ZONES
       * ---------------------------------------------------------
       *
       * These are planning-risk zones, NOT navigation routes.
       *
       * Critical = current detected spill.
       * High     = predicted drift zone.
       * Watch    = possible future expansion.
       */
      plan.riskZones.forEach((zone) => {
        let color = watchColor;

        if (zone.score >= 90) {
          color = criticalColor;
        } else if (zone.score >= 80) {
          color = highRiskColor;
        }

        L.circle(
          [zone.centerLatitude, zone.centerLongitude],
          {
            radius: zone.radiusKm * 1000,
            color,
            fillColor: color,
            fillOpacity: zone.score >= 90 ? 0.16 : 0.09,
            weight: zone.score >= 90 ? 3 : 2,
            dashArray: zone.score >= 90 ? undefined : "8 6",
          },
        )
          .bindTooltip(
            `
              <strong>${zone.label}</strong><br/>
              Risk score: ${zone.score}/100<br/>
              Confidence: ${Math.round(zone.confidence * 100)}%<br/>
              ${zone.reason}
            `,
          )
          .addTo(layerGroup);

        /*
         * Drift direction indicator.
         *
         * This is intentionally an arrow/bearing indicator,
         * NOT a fake vessel navigation line.
         */
        if (zone.id !== "RF-01") {
          const bearingRad = (zone.bearing * Math.PI) / 180;

          const latLength = zone.lengthKm / 111;
          const lngLength =
            zone.lengthKm /
            (111 *
              Math.cos(
                (zone.centerLatitude * Math.PI) / 180,
              ));

          const endLat =
            zone.centerLatitude +
            Math.cos(bearingRad) * latLength;

          const endLng =
            zone.centerLongitude +
            Math.sin(bearingRad) * lngLength;

          L.polyline(
            [
              [zone.centerLatitude, zone.centerLongitude],
              [endLat, endLng],
            ],
            {
              color,
              weight: 2,
              opacity: 0.75,
              dashArray: "5 7",
            },
          ).addTo(layerGroup);
        }
      });

      /*
       * ---------------------------------------------------------
       * 2. DETECTED SPILL
       * ---------------------------------------------------------
       *
       * Until the actual Model-1 segmentation polygon is connected,
       * use a small uncertainty circle around the detection centroid.
       *
       * This is NOT presented as the actual segmentation boundary.
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
          fillOpacity: 0.18,
          weight: 3,
        },
      )
        .bindTooltip(
          `
            <strong>DETECTED OIL SPILL</strong><br/>
            Severity: ${plan.incident.severity}<br/>
            Estimated area: ${plan.incident.spillArea.toFixed(1)} km²<br/>
            Confidence: ${
              plan.incident.detectionConfidence
                ? Math.round(
                    plan.incident.detectionConfidence * 100,
                  )
                : "N/A"
            }%
          `,
        )
        .addTo(layerGroup);

      /*
       * Spill centre marker.
       */
      const incidentIcon = L.divIcon({
        className: "map-pin map-pin-incident",
        html: `
          <span
            style="
              display:flex;
              align-items:center;
              justify-content:center;
              width:34px;
              height:34px;
              border-radius:50%;
              background:${incidentColor};
              color:white;
              font-weight:800;
              border:3px solid white;
              box-shadow:0 2px 10px rgba(0,0,0,.35);
            "
          >
            !
          </span>
        `,
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
          `
            <strong>OIL SPILL DETECTION</strong><br/>
            ${plan.incident.latitude.toFixed(4)},
            ${plan.incident.longitude.toFixed(4)}
          `,
        )
        .addTo(layerGroup);

      /*
       * ---------------------------------------------------------
       * 3. AI ATTRIBUTION / SUSPECTED VESSEL
       * ---------------------------------------------------------
       *
       * If Model 3 is connected, make that vessel visually dominant.
       */
      if (
        plan.attribution.status === "Connected" &&
        plan.attribution.vesselId
      ) {
        const suspected = plan.candidates.find(
          (candidate) =>
            candidate.assetId === plan.attribution.vesselId,
        );

        if (suspected) {
          const suspectIcon = L.divIcon({
            className: "map-pin map-pin-suspected",
            html: `
              <span
                style="
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  width:32px;
                  height:32px;
                  border-radius:50%;
                  background:#111827;
                  color:white;
                  font-weight:800;
                  border:3px solid #ef4444;
                  box-shadow:0 0 0 4px rgba(239,68,68,.18);
                "
              >
                ⚠
              </span>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          L.marker(
            [
              suspected.latitude,
              suspected.longitude,
            ],
            {
              icon: suspectIcon,
            },
          )
            .bindTooltip(
              `
                <strong>SUSPECTED SOURCE VESSEL</strong><br/>
                ${plan.attribution.vesselName ?? suspected.assetName}<br/>
                Attribution score:
                ${plan.attribution.score ?? suspected.score}/100<br/>
                Rank: #${plan.attribution.rank ?? "—"}
              `,
            )
            .addTo(layerGroup);
        }
      }

      /*
       * ---------------------------------------------------------
       * 4. RESPONSE ASSETS
       * ---------------------------------------------------------
       *
       * These are government/emergency resources.
       * They are intentionally separate from AIS vessels.
       */
      plan.candidates.slice(0, 22).forEach((asset) => {
        const selectedAsset = plan.selectedAssets.find(
          (item) => item.assetId === asset.assetId,
        );

        const selected = Boolean(selectedAsset);
        const unavailable =
          asset.status === "Unavailable";

        const color = selected
          ? selectedColor
          : unavailable
            ? mutedColor
            : availableColor;

        const size = selected ? 29 : 18;
        const anchor = selected ? 14 : 9;

        const icon = L.divIcon({
          className: `map-pin ${
            selected
              ? "map-pin-selected"
              : unavailable
                ? "map-pin-unavailable"
                : "map-pin-available"
          }`,
          html: `
            <span
              style="
                display:flex;
                align-items:center;
                justify-content:center;
                width:${size}px;
                height:${size}px;
                border-radius:50%;
                background:${color};
                color:white;
                font-size:${selected ? 12 : 9}px;
                font-weight:800;
                border:2px solid white;
                box-shadow:0 1px 5px rgba(0,0,0,.3);
              "
            >
              ${selectedAsset?.rank ?? "•"}
            </span>
          `,
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
            `
              <strong>${asset.assetName}</strong><br/>
              ${asset.assetType}<br/>
              Status: ${asset.status}<br/>
              Distance: ${asset.distanceKm} km<br/>
              ETA: ${asset.etaMinutes} min<br/>
              Boom: ${asset.boomsM.toLocaleString()} m<br/>
              Recovery: ${asset.skimmerCapacityTph.toFixed(1)} t/h
            `,
          )
          .addTo(layerGroup);
      });

      /*
       * ---------------------------------------------------------
       * 5. MARINE DEPLOYMENT ROUTES
       * ---------------------------------------------------------
       *
       * IMPORTANT:
       * We only draw a route if a real marine route has been
       * supplied by the backend/routing service.
       *
       * No route = no line.
       *
       * This completely eliminates the previous land-crossing
       * straight-line problem.
       */
      plan.marineRoutes?.forEach((route) => {
        if (!route.coordinates?.length) return;

        L.polyline(
          route.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number],
          ),
          {
            color: selectedColor,
            weight: 3,
            opacity: 0.85,
            dashArray: "8 7",
          },
        )
          .bindTooltip(
            `
              <strong>MARINE DEPLOYMENT ROUTE</strong><br/>
              Asset rank: #${route.rank}<br/>
              Route distance: ${route.distanceKm} km<br/>
              ETA: ${route.etaMinutes} min
            `,
          )
          .addTo(layerGroup);
      });

      /*
       * ---------------------------------------------------------
       * 6. ROUTE WARNING WHEN REAL ROUTING IS NOT AVAILABLE
       * ---------------------------------------------------------
       */
      const hasMarineRoutes =
        Boolean(plan.marineRoutes?.length);

      if (
        plan.selectedAssets.some(
          (asset) => asset.category === "Vessel",
        ) &&
        !hasMarineRoutes
      ) {
        L.marker(
          [
            plan.incident.latitude + 0.35,
            plan.incident.longitude + 0.15,
          ],
          {
            icon: L.divIcon({
              className: "map-route-warning",
              html: `
                <div
                  style="
                    background:white;
                    border:1px solid #d97706;
                    color:#92400e;
                    padding:7px 10px;
                    border-radius:5px;
                    font-size:10px;
                    font-weight:700;
                    box-shadow:0 2px 8px rgba(0,0,0,.15);
                    white-space:nowrap;
                  "
                >
                  ⚠ MARINE ROUTING REQUIRED
                </div>
              `,
              iconSize: undefined,
              iconAnchor: [0, 0],
            }),
          },
        ).addTo(layerGroup);
      }

      /*
       * ---------------------------------------------------------
       * 7. MAP EXTENT
       * ---------------------------------------------------------
       *
       * Include the spill + selected resources in the initial view.
       */
      const points: [number, number][] = [
        [
          plan.incident.latitude,
          plan.incident.longitude,
        ],
        ...plan.selectedAssets.map(
          (asset) =>
            [asset.latitude, asset.longitude] as [
              number,
              number,
            ],
        ),
        ...plan.riskZones.map(
          (zone) =>
            [zone.centerLatitude, zone.centerLongitude] as [
              number,
              number,
            ],
        ),
      ];

      if (points.length > 1) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 9,
        });
      }

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
      className="map-canvas"
      aria-label="BlueTrace AI operational map showing oil spill, AI risk zones, AIS attribution, response assets and verified marine routes"
    />
  );
}
