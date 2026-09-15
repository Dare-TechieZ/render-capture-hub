import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type {
  Plan,
  AISVessel,
  RiskZone,
} from "@/lib/responsegrid";

type OperationalMapProps = {
  plan: Plan;
};

type LeafletMap = {
  remove: () => void;
  invalidateSize: (options?: {
    animate?: boolean;
    pan?: boolean;
  }) => LeafletMap;
  fitBounds: (
    bounds: unknown,
    options?: unknown,
  ) => LeafletMap;
};

type LeafletLayerGroup = {
  clearLayers: () => void;
};

function riskColor(zone: RiskZone) {
  if (zone.score >= 90) return "#b42318";
  if (zone.score >= 80) return "#d97706";
  return "#ca8a04";
}

function vesselIconHtml(
  vessel: AISVessel,
) {
  if (vessel.isSuspectedSource) {
    return `
      <div style="
        width:34px;
        height:34px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#111827;
        color:#fff;
        border:3px solid #ef4444;
        box-shadow:0 0 0 5px rgba(239,68,68,.18),0 3px 10px rgba(0,0,0,.35);
        font-size:15px;
        font-weight:900;
      ">⚠</div>
    `;
  }

  return `
    <div style="
      width:22px;
      height:22px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#2563eb;
      color:#fff;
      border:2px solid #fff;
      box-shadow:0 2px 7px rgba(0,0,0,.3);
      font-size:10px;
      font-weight:800;
    ">●</div>
  `;
}

export function OperationalMap({
  plan,
}: OperationalMapProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<LeafletMap | null>(null);

  const layersRef =
    useRef<LeafletLayerGroup | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;
    let resizeObserver:
      | ResizeObserver
      | null = null;

    const initializeMap = async () => {
      const { default: L } =
        await import("leaflet");

      if (
        cancelled ||
        !containerRef.current
      ) {
        return;
      }

      const container =
        containerRef.current;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }

      const map =
        L.map(container, {
          zoomControl: false,
          preferCanvas: true,
        }).setView(
          [
            plan.incident.latitude,
            plan.incident.longitude,
          ],
          8,
        ) as unknown as LeafletMap;

      mapRef.current = map;

      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map as any);

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            "© OpenStreetMap contributors",
          maxZoom: 19,
          crossOrigin: true,
        },
      ).addTo(map as any);

      const layerGroup =
        L.layerGroup().addTo(
          map as any,
        );

      layersRef.current =
        layerGroup;

      /*
       * ==========================================================
       * 1. ACTUAL MODEL-1 DEMO SPILL POLYGON
       * ==========================================================
       *
       * The polygon is the hardcoded segmentation output.
       * Do not describe the surrounding circles as the actual
       * segmentation mask.
       */
      if (
        plan.incident.spillPolygon
          ?.length
      ) {
        L.polygon(
          plan.incident.spillPolygon.map(
            ([lng, lat]) =>
              [lat, lng] as [
                number,
                number,
              ],
          ),
          {
            color: "#b42318",
            fillColor: "#b42318",
            fillOpacity: 0.28,
            weight: 3,
          },
        )
          .bindTooltip(
            `
              <strong>MODEL 1 · DETECTED OIL SPILL</strong><br/>
              Area: ${plan.incident.spillArea.toFixed(1)} km²<br/>
              Confidence: ${
                plan.incident
                  .detectionConfidence
                  ? Math.round(
                      plan.incident
                        .detectionConfidence *
                        100,
                    )
                  : "N/A"
              }%<br/>
              Source: ${
                plan.incident
                  .satelliteSource ??
                "Demo satellite input"
              }
            `,
          )
          .addTo(layerGroup);
      }

      /*
       * Spill centre marker.
       */
      const incidentIcon =
        L.divIcon({
          className:
            "bluetrace-incident",
          html: `
            <div style="
              width:38px;
              height:38px;
              border-radius:50%;
              display:flex;
              align-items:center;
              justify-content:center;
              background:#b42318;
              color:#fff;
              border:3px solid #fff;
              box-shadow:0 0 0 5px rgba(180,35,24,.18),0 3px 10px rgba(0,0,0,.35);
              font-size:17px;
              font-weight:900;
            ">!</div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
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
            ${plan.incident.longitude.toFixed(4)}<br/>
            Severity: ${plan.incident.severity}
          `,
        )
        .addTo(layerGroup);

      /*
       * ==========================================================
       * 2. AI RED-FLAG ZONES
       * ==========================================================
       */
      plan.riskZones.forEach(
        (zone) => {
          const color =
            riskColor(zone);

          L.circle(
            [
              zone.centerLatitude,
              zone.centerLongitude,
            ],
            {
              radius:
                zone.radiusKm * 1000,
              color,
              fillColor: color,
              fillOpacity:
                zone.score >= 90
                  ? 0.16
                  : 0.10,
              weight:
                zone.score >= 90
                  ? 3
                  : 2,
              dashArray:
                zone.score >= 90
                  ? undefined
                  : "8 6",
            },
          )
            .bindTooltip(
              `
                <strong>${zone.label}</strong><br/>
                Risk score: ${zone.score}/100<br/>
                Confidence: ${Math.round(
                  zone.confidence * 100,
                )}%<br/>
                ${zone.reason}
              `,
            )
            .addTo(layerGroup);

          /*
           * Direction line = spill drift indicator only.
           * It is NOT a vessel route.
           */
          if (
            zone.id !== "RF-01"
          ) {
            const bearingRad =
              (zone.bearing *
                Math.PI) /
              180;

            const lengthKm =
              zone.id === "RF-02"
                ? 12
                : 18;

            const latLength =
              lengthKm / 111;

            const lngLength =
              lengthKm /
              (111 *
                Math.cos(
                  (zone.centerLatitude *
                    Math.PI) /
                    180,
                ));

            const endLat =
              zone.centerLatitude +
              Math.cos(
                bearingRad,
              ) *
                latLength;

            const endLng =
              zone.centerLongitude +
              Math.sin(
                bearingRad,
              ) *
                lngLength;

            L.polyline(
              [
                [
                  zone.centerLatitude,
                  zone.centerLongitude,
                ],
                [endLat, endLng],
              ],
              {
                color,
                weight: 3,
                opacity: 0.7,
                dashArray: "5 7",
              },
            ).addTo(layerGroup);
          }
        },
      );

      /*
       * ==========================================================
       * 3. AIS TRAJECTORIES
       * ==========================================================
       *
       * These are curved/multi-point historical tracks.
       * No vessel is connected to the spill by a fake straight line.
       */
      plan.aisVessels.forEach(
        (vessel) => {
          if (
            vessel.track.length >= 2
          ) {
            L.polyline(
              vessel.track.map(
                ([lng, lat]) =>
                  [lat, lng] as [
                    number,
                    number,
                  ],
              ),
              {
                color:
                  vessel.isSuspectedSource
                    ? "#ef4444"
                    : "#2563eb",
                weight:
                  vessel.isSuspectedSource
                    ? 4
                    : 2,
                opacity:
                  vessel.isSuspectedSource
                    ? 0.85
                    : 0.45,
                dashArray:
                  vessel.isSuspectedSource
                    ? "9 5"
                    : "5 8",
              },
            )
              .bindTooltip(
                vessel.isSuspectedSource
                  ? "<strong>MODEL 3 · SUSPECTED SOURCE TRACK</strong>"
                  : `<strong>AIS TRACK</strong><br/>${vessel.vesselName}`,
              )
              .addTo(layerGroup);
          }

          const icon =
            L.divIcon({
              className:
                "bluetrace-vessel",
              html:
                vesselIconHtml(
                  vessel,
                ),
              iconSize:
                vessel.isSuspectedSource
                  ? [34, 34]
                  : [22, 22],
              iconAnchor:
                vessel.isSuspectedSource
                  ? [17, 17]
                  : [11, 11],
            });

          L.marker(
            [
              vessel.latitude,
              vessel.longitude,
            ],
            {
              icon,
            },
          )
            .bindTooltip(
              `
                <strong>${
                  vessel.isSuspectedSource
                    ? "⚠ SUSPECTED SOURCE VESSEL"
                    : "AIS VESSEL"
                }</strong><br/>
                ${vessel.vesselName}<br/>
                Type: ${vessel.vesselType}<br/>
                Speed: ${vessel.speedKnots} kn<br/>
                Heading: ${vessel.heading}°<br/>
                ${
                  vessel.attributionScore !==
                  undefined
                    ? `Model-3 attribution: ${vessel.attributionScore}/100<br/>Rank: #${vessel.attributionRank}`
                    : ""
                }
              `,
            )
            .addTo(layerGroup);
        },
      );

      /*
       * ==========================================================
       * 4. RESPONSE ASSETS
       * ==========================================================
       */
      plan.candidates
        .slice(0, 16)
        .forEach((asset) => {
          const selected =
            plan.selectedAssets.find(
              (item) =>
                item.assetId ===
                asset.assetId,
            );

          const color = selected
            ? "#173f68"
            : asset.status ===
                "Unavailable"
              ? "#64748b"
              : "#2f7d4b";

          const size = selected
            ? 30
            : 20;

          const icon =
            L.divIcon({
              className:
                "bluetrace-response",
              html: `
                <div style="
                  width:${size}px;
                  height:${size}px;
                  border-radius:50%;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:${color};
                  color:#fff;
                  border:2px solid #fff;
                  box-shadow:0 2px 7px rgba(0,0,0,.32);
                  font-size:${selected ? 11 : 9}px;
                  font-weight:800;
                ">
                  ${
                    selected
                      ? selected.rank
                      : "•"
                  }
                </div>
              `,
              iconSize: [
                size,
                size,
              ],
              iconAnchor: [
                size / 2,
                size / 2,
              ],
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
                ${
                  selected
                    ? `Deployment rank: #${selected.rank}<br/>`
                    : ""
                }
                ETA: ${asset.etaMinutes} min<br/>
                Distance: ${asset.distanceKm} km<br/>
                Boom: ${asset.boomsM.toLocaleString()} m<br/>
                Recovery: ${asset.skimmerCapacityTph.toFixed(1)} t/h
              `,
            )
            .addTo(layerGroup);
        });

      /*
       * ==========================================================
       * 5. HARD-CODED DEMO MARINE ROUTES
       * ==========================================================
       *
       * These are the only response-vessel lines shown.
       *
       * They use multiple offshore waypoints. There is deliberately
       * no generic [asset, incident] straight line.
       */
      plan.marineRoutes.forEach(
        (route) => {
          L.polyline(
            route.coordinates.map(
              ([lng, lat]) =>
                [lat, lng] as [
                  number,
                  number,
                ],
            ),
            {
              color: "#173f68",
              weight: 4,
              opacity: 0.85,
              dashArray: "10 7",
            },
          )
            .bindTooltip(
              `
                <strong>DEMO MARINE DEPLOYMENT CORRIDOR</strong><br/>
                Asset rank: #${route.rank}<br/>
                Route distance: ${route.distanceKm} km<br/>
                ETA: ${route.etaMinutes} min<br/>
                <span style="color:#92400e">
                  Replace with verified marine routing before operational use.
                </span>
              `,
            )
            .addTo(layerGroup);
        },
      );

      /*
       * ==========================================================
       * 6. MAP INFORMATION CONTROL
       * ==========================================================
       */
      const infoControl =
        L.control({
          position: "topright",
        });

      infoControl.onAdd =
        () => {
          const div =
            L.DomUtil.create(
              "div",
              "bluetrace-map-control",
            );

          div.innerHTML = `
            <div style="
              width:250px;
              background:rgba(255,255,255,.96);
              border:1px solid #cbd5e1;
              box-shadow:0 3px 12px rgba(0,0,0,.16);
              padding:12px;
              font-family:ui-sans-serif,system-ui,sans-serif;
            ">
              <div style="
                font-size:10px;
                font-weight:800;
                letter-spacing:.12em;
                text-transform:uppercase;
                color:#475569;
              ">
                BlueTrace AI · Operational Layers
              </div>

              <div style="
                margin-top:9px;
                display:grid;
                gap:7px;
                font-size:10px;
                color:#334155;
              ">
                <div>🔴 <b>Spill</b> · Model-1 detection</div>
                <div>🟥 <b>Critical</b> · immediate containment</div>
                <div>🟧 <b>High</b> · predicted drift</div>
                <div>🟨 <b>Watch</b> · expansion monitoring</div>
                <div>⚠️ <b>Suspected vessel</b> · Model-3</div>
                <div>🔵 <b>AIS</b> · maritime traffic</div>
                <div>🟢 <b>Response asset</b></div>
                <div>━ <b>Marine corridor</b> · demo route</div>
              </div>

              <div style="
                margin-top:10px;
                padding-top:8px;
                border-top:1px solid #e2e8f0;
                font-size:9px;
                line-height:1.45;
                color:#64748b;
              ">
                DEMO MODE · AIS, Model-1, Model-3,
                environmental and resource values are
                hardcoded for the SIH demonstration.
              </div>
            </div>
          `;

          L.DomEvent.disableClickPropagation(
            div,
          );

          return div;
        };

      infoControl.addTo(
        map as any,
      );

      /*
       * ==========================================================
       * 7. AI RECOMMENDATION CONTROL
       * ==========================================================
       */
      const recommendation =
        L.control({
          position: "bottomleft",
        });

      recommendation.onAdd =
        () => {
          const div =
            L.DomUtil.create(
              "div",
              "bluetrace-ai-recommendation",
            );

          const topRisk =
            plan.riskZones[0];

          const highRisk =
            plan.riskZones.find(
              (zone) =>
                zone.score >= 90 &&
                zone.id !==
                  "RF-01",
            ) ??
            plan.riskZones[1];

          div.innerHTML = `
            <div style="
              width:320px;
              background:rgba(17,24,39,.95);
              color:white;
              border-left:4px solid #ef4444;
              box-shadow:0 3px 12px rgba(0,0,0,.28);
              padding:11px 13px;
              font-family:ui-sans-serif,system-ui,sans-serif;
            ">
              <div style="
                font-size:9px;
                letter-spacing:.13em;
                text-transform:uppercase;
                color:#cbd5e1;
                font-weight:800;
              ">
                AI Response Recommendation
              </div>

              <div style="
                margin-top:5px;
                font-size:12px;
                font-weight:800;
              ">
                Prioritize the critical spill zone.
              </div>

              <div style="
                margin-top:5px;
                font-size:10px;
                line-height:1.45;
                color:#cbd5e1;
              ">
                Stage containment and recovery resources
                toward the predicted drift zone and maintain
                surveillance over the watch area.
              </div>

              <div style="
                margin-top:8px;
                display:flex;
                gap:12px;
                font-size:9px;
                color:#e2e8f0;
              ">
                <span>
                  <b style="color:#fca5a5">
                    ${topRisk?.score ?? "—"}/100
                  </b>
                  critical
                </span>

                <span>
                  <b style="color:#fdba74">
                    ${highRisk?.score ?? "—"}/100
                  </b>
                  drift
                </span>

                <span>
                  <b style="color:#fde68a">
                    ${plan.attribution.score ?? "—"}
                  </b>
                  attribution
                </span>
              </div>
            </div>
          `;

          L.DomEvent.disableClickPropagation(
            div,
          );

          return div;
        };

      recommendation.addTo(
        map as any,
      );

      /*
       * ==========================================================
       * 8. MAP EXTENT
       * ==========================================================
       */
      const points: [
        number,
        number,
      ][] = [
        [
          plan.incident.latitude,
          plan.incident.longitude,
        ],

        ...plan.aisVessels.map(
          (vessel) =>
            [
              vessel.latitude,
              vessel.longitude,
            ] as [
              number,
              number,
            ],
        ),

        ...plan.selectedAssets.map(
          (asset) =>
            [
              asset.latitude,
              asset.longitude,
            ] as [
              number,
              number,
            ],
        ),

        ...plan.riskZones.map(
          (zone) =>
            [
              zone.centerLatitude,
              zone.centerLongitude,
            ] as [
              number,
              number,
            ],
        ),
      ];

      if (points.length > 1) {
        const bounds =
          L.latLngBounds(
            points,
          );

        map.fitBounds(
          bounds,
          {
            padding: [
              40, 40,
            ],
            maxZoom: 9,
          },
        );
      }

      map.invalidateSize({
        animate: false,
        pan: false,
      });

      requestAnimationFrame(
        () => {
          if (!cancelled) {
            map.invalidateSize({
              animate: false,
              pan: false,
            });
          }
        },
      );

      resizeObserver =
        new ResizeObserver(
          () => {
            if (!cancelled) {
              map.invalidateSize({
                animate: false,
                pan: false,
              });
            }
          },
        );

      resizeObserver.observe(
        container,
      );
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
      aria-label="BlueTrace AI operational map"
    />
  );
}
