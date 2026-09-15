export type Severity = "Low" | "Moderate" | "High" | "Critical";

export type Incident = {
  latitude: number;
  longitude: number;
  spillArea: number;
  severity: Severity;
  maxAssets: number;

  // Hardcoded Model-1 demo output.
  detectionConfidence?: number;
  detectionTime?: string;
  satelliteSource?: string;

  // Actual segmented spill outline for the demo scenario.
  spillPolygon?: Array<[number, number]>;
};

export type Asset = {
  assetId: string;
  assetName: string;
  assetType: string;
  category: "Vessel" | "Equipment" | "Crew" | "Support";
  latitude: number;
  longitude: number;
  region: string;
  status: "Available" | "Standby" | "Unavailable";
  crewCount: number;
  boomsM: number;
  skimmerCapacityTph: number;
  storageCapacityT: number;
  speedKnots: number;
  responseRadiusKm: number;
  specialization: string;
  deploymentCost: number;
};

export type PlanAsset = Asset & {
  rank: number;
  distanceKm: number;
  etaMinutes: number;
  score: number;
  capability: "High" | "Medium" | "Low";
  reason: string;
};

export type AISVessel = {
  vesselId: string;
  vesselName: string;
  latitude: number;
  longitude: number;
  speedKnots: number;
  heading: number;
  vesselType: string;
  attributionScore?: number;
  attributionRank?: number;
  isSuspectedSource: boolean;
  track: Array<[number, number]>;
};

export type RiskZone = {
  id: string;
  label: string;
  score: number;
  confidence: number;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  bearing: number;
  reason: string;
};

export type MarineRoute = {
  assetId: string;
  rank: number;
  coordinates: Array<[number, number]>; // [longitude, latitude]
  distanceKm: number;
  etaMinutes: number;
  routingMode: "marine-corridor";
};

export type Plan = {
  incident: Incident;
  selectedAssets: PlanAsset[];
  candidates: Array<Asset & {
    distanceKm: number;
    etaMinutes: number;
    score: number;
  }>;
  requirements: {
    boomM: number;
    recoveryTph: number;
    crew: number;
  };
  summary: {
    crew: number;
    recoveryTph: number;
    boomM: number;
    firstEta: number;
    maxEta: number;
    totalStorageT: number;
  };
  gap: {
    boomM: number;
    recoveryTph: number;
    crew: number;
    status: "Sufficient" | "Attention";
  };
  infrastructure: RegionalCapacity;
  environment: Environment;

  // Hardcoded integrated demo outputs.
  aisVessels: AISVessel[];
  riskZones: RiskZone[];
  marineRoutes: MarineRoute[];

  attribution: {
    status: "Connected" | "Pending";
    vesselId?: string;
    vesselName?: string;
    score?: number;
    rank?: number;
  };
};

export type Environment = {
  available: boolean;
  wind: string;
  windDirection: string;
  wave: string;
  waveDirection: string;
  current: string;
};

export type RegionalCapacity = {
  region: string;
  nearestPort: string;
  portDistanceKm: number;
  responseStations: number;
  supportFacilities: number;
  vessels: number;
  patrol: number;
  workBoats: number;
  skimmers: number;
  boomM: number;
  storageT: number;
  crew: number;
};

type Region = {
  name: string;
  latitude: number;
  longitude: number;
  port: string;
};

const regions: Region[] = [
  { name: "Mumbai", latitude: 19.076, longitude: 72.8777, port: "Jawaharlal Nehru Port" },
  { name: "Gujarat", latitude: 22.3072, longitude: 70.8022, port: "Sikka Port" },
  { name: "Kandla", latitude: 23.0333, longitude: 70.2167, port: "Deendayal Port" },
  { name: "Goa", latitude: 15.4909, longitude: 73.8278, port: "Mormugao Port" },
  { name: "Mangalore", latitude: 12.9141, longitude: 74.856, port: "New Mangalore Port" },
  { name: "Kochi", latitude: 9.9312, longitude: 76.2673, port: "Cochin Port" },
  { name: "Chennai", latitude: 13.0827, longitude: 80.2707, port: "Chennai Port" },
  { name: "Visakhapatnam", latitude: 17.6868, longitude: 83.2185, port: "Visakhapatnam Port" },
  { name: "Paradip", latitude: 20.2961, longitude: 86.6112, port: "Paradip Port" },
  { name: "West Bengal", latitude: 21.65, longitude: 88.35, port: "Haldia Dock Complex" },
  { name: "Andaman & Nicobar", latitude: 11.6234, longitude: 92.7265, port: "Port Blair" },
  { name: "Lakshadweep", latitude: 10.5667, longitude: 72.6417, port: "Kavaratti Jetty" },
];

/*
 * DEMO RESPONSE REGISTER
 *
 * These are hardcoded demonstration resources for the SIH UI.
 * They are NOT claimed to be live government positions.
 *
 * Replace this array later with your verified response-resource feed.
 */
export const assets: Asset[] = [
  {
    assetId: "RESP-GJ-01",
    assetName: "Gujarat Pollution Response Vessel",
    assetType: "Pollution Response Vessel",
    category: "Vessel",
    latitude: 21.08,
    longitude: 72.62,
    region: "Gujarat",
    status: "Available",
    crewCount: 14,
    boomsM: 520,
    skimmerCapacityTph: 9.2,
    storageCapacityT: 110,
    speedKnots: 15,
    responseRadiusKm: 120,
    specialization: "Offshore recovery",
    deploymentCost: 86000,
  },
  {
    assetId: "RESP-GJ-02",
    assetName: "Gujarat Coastal Patrol",
    assetType: "Patrol Vessel",
    category: "Vessel",
    latitude: 21.16,
    longitude: 72.67,
    region: "Gujarat",
    status: "Available",
    crewCount: 9,
    boomsM: 140,
    skimmerCapacityTph: 1.6,
    storageCapacityT: 15,
    speedKnots: 22,
    responseRadiusKm: 160,
    specialization: "Survey and perimeter",
    deploymentCost: 31000,
  },
  {
    assetId: "RESP-GJ-03",
    assetName: "Rapid Containment Boom Team",
    assetType: "Containment Boom Unit",
    category: "Equipment",
    latitude: 21.12,
    longitude: 72.64,
    region: "Gujarat",
    status: "Available",
    crewCount: 7,
    boomsM: 720,
    skimmerCapacityTph: 0,
    storageCapacityT: 0,
    speedKnots: 0,
    responseRadiusKm: 40,
    specialization: "Rapid containment",
    deploymentCost: 18000,
  },
  {
    assetId: "RESP-GJ-04",
    assetName: "Gujarat Oil Skimmer Unit",
    assetType: "Oil Skimmer",
    category: "Equipment",
    latitude: 21.10,
    longitude: 72.66,
    region: "Gujarat",
    status: "Available",
    crewCount: 5,
    boomsM: 100,
    skimmerCapacityTph: 6.5,
    storageCapacityT: 30,
    speedKnots: 8,
    responseRadiusKm: 45,
    specialization: "High-viscosity recovery",
    deploymentCost: 24000,
  },
  {
    assetId: "RESP-MH-01",
    assetName: "Mumbai Pollution Response Vessel",
    assetType: "Pollution Response Vessel",
    category: "Vessel",
    latitude: 18.93,
    longitude: 72.70,
    region: "Mumbai",
    status: "Standby",
    crewCount: 13,
    boomsM: 460,
    skimmerCapacityTph: 8.0,
    storageCapacityT: 90,
    speedKnots: 15,
    responseRadiusKm: 110,
    specialization: "Offshore recovery",
    deploymentCost: 90000,
  },
  {
    assetId: "RESP-MH-02",
    assetName: "Mumbai Support Skimmer",
    assetType: "Oil Skimmer",
    category: "Equipment",
    latitude: 19.02,
    longitude: 72.78,
    region: "Mumbai",
    status: "Available",
    crewCount: 4,
    boomsM: 90,
    skimmerCapacityTph: 5.8,
    storageCapacityT: 26,
    speedKnots: 8,
    responseRadiusKm: 45,
    specialization: "Recovery support",
    deploymentCost: 26000,
  },
];

const DEMO_AIS_VESSELS: AISVessel[] = [
  {
    vesselId: "AIS-DEMO-001",
    vesselName: "Suspected Source Vessel A",
    latitude: 21.78,
    longitude: 71.72,
    speedKnots: 11.4,
    heading: 135,
    vesselType: "Tanker",
    attributionScore: 87.4,
    attributionRank: 1,
    isSuspectedSource: true,
    track: [
      [71.38, 22.10],
      [71.46, 22.03],
      [71.55, 21.96],
      [71.64, 21.88],
      [71.72, 21.78],
    ],
  },
  {
    vesselId: "AIS-DEMO-002",
    vesselName: "Cargo Vessel B",
    latitude: 21.62,
    longitude: 71.56,
    speedKnots: 13.2,
    heading: 112,
    vesselType: "Cargo",
    attributionScore: 62.1,
    attributionRank: 2,
    isSuspectedSource: false,
    track: [
      [71.18, 21.83],
      [71.29, 21.77],
      [71.39, 21.70],
      [71.48, 21.64],
      [71.56, 21.62],
    ],
  },
  {
    vesselId: "AIS-DEMO-003",
    vesselName: "Coastal Tanker C",
    latitude: 21.92,
    longitude: 72.05,
    speedKnots: 9.8,
    heading: 180,
    vesselType: "Tanker",
    attributionScore: 54.7,
    attributionRank: 3,
    isSuspectedSource: false,
    track: [
      [72.02, 22.31],
      [72.04, 22.20],
      [72.05, 22.10],
      [72.05, 22.00],
      [72.05, 21.92],
    ],
  },
  {
    vesselId: "AIS-DEMO-004",
    vesselName: "Cargo Vessel D",
    latitude: 21.48,
    longitude: 72.73,
    speedKnots: 12.7,
    heading: 250,
    vesselType: "Cargo",
    attributionScore: 48.3,
    attributionRank: 4,
    isSuspectedSource: false,
    track: [
      [73.12, 21.63],
      [73.01, 21.59],
      [72.91, 21.55],
      [72.82, 21.51],
      [72.73, 21.48],
    ],
  },
  {
    vesselId: "AIS-DEMO-005",
    vesselName: "Service Vessel E",
    latitude: 21.23,
    longitude: 72.02,
    speedKnots: 7.1,
    heading: 70,
    vesselType: "Service",
    attributionScore: 41.5,
    attributionRank: 5,
    isSuspectedSource: false,
    track: [
      [71.62, 21.08],
      [71.72, 21.13],
      [71.83, 21.17],
      [71.93, 21.21],
      [72.02, 21.23],
    ],
  },
  {
    vesselId: "AIS-DEMO-006",
    vesselName: "Bulk Carrier F",
    latitude: 21.34,
    longitude: 72.42,
    speedKnots: 10.2,
    heading: 300,
    vesselType: "Cargo",
    attributionScore: 38.4,
    attributionRank: 6,
    isSuspectedSource: false,
    track: [
      [72.76, 21.05],
      [72.67, 21.13],
      [72.59, 21.20],
      [72.50, 21.27],
      [72.42, 21.34],
    ],
  },
];

const DEMO_INCIDENT: Incident = {
  latitude: 21.45,
  longitude: 72.15,
  spillArea: 5.2,
  severity: "High",
  maxAssets: 5,
  detectionConfidence: 0.91,
  detectionTime: "2026-09-15T03:40:00Z",
  satelliteSource: "Sentinel-1",
  spillPolygon: [
    [72.105, 21.425],
    [72.125, 21.395],
    [72.175, 21.390],
    [72.205, 21.420],
    [72.215, 21.455],
    [72.185, 21.480],
    [72.135, 21.475],
  ],
};

const DEMO_ENVIRONMENT: Environment = {
  available: true,
  wind: "18 km/h",
  windDirection: "WNW",
  wave: "1.4 m",
  waveDirection: "NW",
  current: "0.7 kn SW",
};

function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
) {
  const earthRadius = 6371;
  const latitudeDelta = ((bLat - aLat) * Math.PI) / 180;
  const longitudeDelta = ((bLng - aLng) * Math.PI) / 180;

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

export { haversineKm };

function buildRiskZones(
  incident: Incident,
  environment: Environment,
): RiskZone[] {
  /*
   * Demo environmental drift model.
   *
   * Wind + current produce the planning direction.
   * This is a UI/demo approximation, not a numerical ocean model.
   */
  const direction: [number, number] = [-0.72, -0.69];

  const move = (distanceKm: number) => ({
    latitude:
      incident.latitude +
      (direction[0] * distanceKm) / 111,

    longitude:
      incident.longitude +
      (direction[1] * distanceKm) /
        (111 *
          Math.cos(
            (incident.latitude * Math.PI) / 180,
          )),
  });

  const drift = move(9);
  const expansion = move(19);

  return [
    {
      id: "RF-01",
      label: "CRITICAL · Active spill",
      score: 96,
      confidence: incident.detectionConfidence ?? 0.91,
      centerLatitude: incident.latitude,
      centerLongitude: incident.longitude,
      radiusKm: 2.2,
      bearing: 226,
      reason:
        "Detected slick requires immediate containment and recovery.",
    },
    {
      id: "RF-02",
      label: "HIGH · Predicted drift",
      score: 91,
      confidence: 0.84,
      centerLatitude: drift.latitude,
      centerLongitude: drift.longitude,
      radiusKm: 5.0,
      bearing: 226,
      reason:
        `AI drift assessment combines ${environment.windDirection} wind with ${environment.current} current.`,
    },
    {
      id: "RF-03",
      label: "WATCH · Expansion area",
      score: 76,
      confidence: 0.72,
      centerLatitude: expansion.latitude,
      centerLongitude: expansion.longitude,
      radiusKm: 7.5,
      bearing: 226,
      reason:
        "Monitor for secondary spread and re-score after the next observation.",
    },
  ];
}

function buildMarineRoutes(
  selectedAssets: PlanAsset[],
): MarineRoute[] {
  /*
   * These are HARDCODED DEMO SEA CORRIDORS.
   *
   * They deliberately contain intermediate offshore points instead
   * of connecting two points with a straight line across land.
   *
   * Replace them with a real marine routing result later.
   */
  const routeByAsset: Record<
    string,
    Array<[number, number]>
  > = {
    "RESP-GJ-01": [
      [72.62, 21.08],
      [72.55, 21.12],
      [72.46, 21.20],
      [72.36, 21.29],
      [72.27, 21.37],
      [72.21, 21.42],
      [72.15, 21.45],
    ],
    "RESP-MH-01": [
      [72.70, 18.93],
      [72.56, 19.12],
      [72.40, 19.35],
      [72.25, 19.65],
      [72.10, 20.00],
      [72.02, 20.40],
      [72.04, 20.80],
      [72.10, 21.15],
      [72.15, 21.45],
    ],
  };

  return selectedAssets
    .filter(
      (asset) =>
        asset.category === "Vessel" &&
        routeByAsset[asset.assetId],
    )
    .map((asset) => ({
      assetId: asset.assetId,
      rank: asset.rank,
      coordinates: routeByAsset[asset.assetId],
      distanceKm: Number(
        (
          haversineKm(
            asset.latitude,
            asset.longitude,
            21.45,
            72.15,
          ) * 1.08
        ).toFixed(1),
      ),
      etaMinutes: asset.etaMinutes,
      routingMode: "marine-corridor",
    }));
}

export function getEnvironment(
  _latitude: number,
  _longitude: number,
): Environment {
  return DEMO_ENVIRONMENT;
}

export function getInfrastructure(
  latitude: number,
  longitude: number,
): RegionalCapacity {
  const region = regions.reduce((closest, candidate) =>
    haversineKm(
      latitude,
      longitude,
      candidate.latitude,
      candidate.longitude,
    ) <
    haversineKm(
      latitude,
      longitude,
      closest.latitude,
      closest.longitude,
    )
      ? candidate
      : closest,
  );

  /*
   * Demo regional capacity values.
   * Replace with verified resource-register values later.
   */
  if (region.name === "Gujarat") {
    return {
      region: "Gujarat",
      nearestPort: "Sikka Port",
      portDistanceKm: 118.4,
      responseStations: 3,
      supportFacilities: 5,
      vessels: 3,
      patrol: 1,
      workBoats: 3,
      skimmers: 2,
      boomM: 1840,
      storageT: 166,
      crew: 52,
    };
  }

  return {
    region: region.name,
    nearestPort: region.port,
    portDistanceKm: Number(
      haversineKm(
        latitude,
        longitude,
        region.latitude,
        region.longitude,
      ).toFixed(1),
    ),
    responseStations: 2,
    supportFacilities: 3,
    vessels: 2,
    patrol: 1,
    workBoats: 2,
    skimmers: 1,
    boomM: 900,
    storageT: 90,
    crew: 28,
  };
}

export function calculatePlan(
  incident: Incident,
): Plan {
  const requirements = {
    boomM: 1500,
    recoveryTph: 17.0,
    crew: 28,
  };

  const candidates = assets
    .map((asset) => {
      const distanceKm = haversineKm(
        incident.latitude,
        incident.longitude,
        asset.latitude,
        asset.longitude,
      );

      const etaMinutes =
        asset.speedKnots > 0
          ? Math.max(
              8,
              Math.round(
                (distanceKm /
                  (asset.speedKnots * 1.852)) *
                  60,
              ),
            )
          : Math.round(distanceKm * 1.8 + 25);

      const proximity = Math.max(
        0,
        45 - distanceKm * 0.3,
      );

      const capability = Math.min(
        30,
        asset.skimmerCapacityTph * 2.2 +
          asset.boomsM / 80 +
          asset.storageCapacityT / 25,
      );

      const readiness =
        asset.status === "Available"
          ? 18
          : asset.status === "Standby"
            ? 8
            : 0;

      const specialization =
        incident.severity === "High" ||
        incident.severity === "Critical"
          ? asset.category === "Vessel"
            ? 8
            : 5
          : 3;

      const score = Math.max(
        0,
        Math.min(
          100,
          proximity +
            capability +
            readiness +
            specialization -
            etaMinutes * 0.05,
        ),
      );

      return {
        ...asset,
        distanceKm: Number(
          distanceKm.toFixed(1),
        ),
        etaMinutes,
        score: Number(score.toFixed(1)),
      };
    })
    .filter(
      (asset) =>
        asset.status !== "Unavailable",
    )
    .sort(
      (a, b) => b.score - a.score,
    );

  const selected = candidates.slice(
    0,
    Math.min(
      incident.maxAssets,
      candidates.length,
    ),
  );

  const selectedAssets = selected.map(
    (asset, index) => {
      const capability: PlanAsset["capability"] =
        asset.skimmerCapacityTph >= 6 ||
        asset.boomsM >= 450
          ? "High"
          : asset.skimmerCapacityTph >= 2 ||
              asset.boomsM >= 150
            ? "Medium"
            : "Low";

      return {
        ...asset,
        rank: index + 1,
        capability,
        reason:
          asset.distanceKm <= 30
            ? `Closest ${capability.toLowerCase()}-capability resource; ${asset.etaMinutes} min ETA.`
            : `Strong ${asset.specialization.toLowerCase()} fit for the current incident posture.`,
      };
    },
  );

  /*
   * Force the intended demo deployment order so the screenshot
   * is deterministic and easy to explain during SIH.
   */
  const preferredOrder = [
    "RESP-GJ-01",
    "RESP-GJ-04",
    "RESP-GJ-03",
    "RESP-GJ-02",
    "RESP-MH-01",
  ];

  selectedAssets.sort(
    (a, b) =>
      preferredOrder.indexOf(a.assetId) -
      preferredOrder.indexOf(b.assetId),
  );

  selectedAssets.forEach(
    (asset, index) => {
      asset.rank = index + 1;
    },
  );

  const summary = {
    crew: selectedAssets.reduce(
      (sum, asset) =>
        sum + asset.crewCount,
      0,
    ),
    recoveryTph: Number(
      selectedAssets
        .reduce(
          (sum, asset) =>
            sum +
            asset.skimmerCapacityTph,
          0,
        )
        .toFixed(1),
    ),
    boomM: selectedAssets.reduce(
      (sum, asset) =>
        sum + asset.boomsM,
      0,
    ),
    firstEta: selectedAssets.length
      ? Math.min(
          ...selectedAssets.map(
            (asset) =>
              asset.etaMinutes,
          ),
        )
      : 0,
    maxEta: selectedAssets.length
      ? Math.max(
          ...selectedAssets.map(
            (asset) =>
              asset.etaMinutes,
          ),
        )
      : 0,
    totalStorageT:
      selectedAssets.reduce(
        (sum, asset) =>
          sum +
          asset.storageCapacityT,
        0,
      ),
  };

  const environment =
    getEnvironment(
      incident.latitude,
      incident.longitude,
    );

  const riskZones =
    buildRiskZones(
      incident,
      environment,
    );

  const marineRoutes =
    buildMarineRoutes(
      selectedAssets,
    );

  const suspected =
    DEMO_AIS_VESSELS.find(
      (vessel) =>
        vessel.isSuspectedSource,
    );

  return {
    incident,
    selectedAssets,
    candidates,
    requirements,
    summary,
    gap: {
      boomM: Math.max(
        0,
        requirements.boomM -
          summary.boomM,
      ),
      recoveryTph: Math.max(
        0,
        Number(
          (
            requirements.recoveryTph -
            summary.recoveryTph
          ).toFixed(1),
        ),
      ),
      crew: Math.max(
        0,
        requirements.crew -
          summary.crew,
      ),
      status:
        requirements.boomM <=
          summary.boomM &&
        requirements.recoveryTph <=
          summary.recoveryTph &&
        requirements.crew <=
          summary.crew
          ? "Sufficient"
          : "Attention",
    },
    infrastructure:
      getInfrastructure(
        incident.latitude,
        incident.longitude,
      ),
    environment,
    aisVessels: DEMO_AIS_VESSELS,
    riskZones,
    marineRoutes,
    attribution: suspected
      ? {
          status: "Connected",
          vesselId:
            suspected.vesselId,
          vesselName:
            suspected.vesselName,
          score:
            suspected.attributionScore,
          rank:
            suspected.attributionRank,
        }
      : {
          status: "Pending",
        },
  };
}

export function createGeoJson(
  plan: Plan,
) {
  return {
    type: "FeatureCollection",
    features: [
      ...(plan.incident.spillPolygon
        ? [
            {
              type: "Feature",
              properties: {
                kind: "detected-spill",
                severity:
                  plan.incident.severity,
                confidence:
                  plan.incident
                    .detectionConfidence,
              },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    ...plan.incident.spillPolygon.map(
                      ([lng, lat]) => [
                        lng,
                        lat,
                      ],
                    ),
                    [
                      plan.incident
                        .spillPolygon[0][0],
                      plan.incident
                        .spillPolygon[0][1],
                    ],
                  ],
                ],
              },
            },
          ]
        : []),

      ...plan.riskZones.map(
        (zone) => ({
          type: "Feature",
          properties: {
            kind: "ai-red-flag",
            id: zone.id,
            score: zone.score,
            confidence:
              zone.confidence,
            label: zone.label,
          },
          geometry: {
            type: "Point",
            coordinates: [
              zone.centerLongitude,
              zone.centerLatitude,
            ],
          },
        }),
      ),

      ...plan.aisVessels.map(
        (vessel) => ({
          type: "Feature",
          properties: {
            kind: vessel.isSuspectedSource
              ? "suspected-vessel"
              : "ais-vessel",
            vesselId:
              vessel.vesselId,
            name:
              vessel.vesselName,
            attributionScore:
              vessel.attributionScore,
          },
          geometry: {
            type: "Point",
            coordinates: [
              vessel.longitude,
              vessel.latitude,
            ],
          },
        }),
      ),

      ...plan.aisVessels.map(
        (vessel) => ({
          type: "Feature",
          properties: {
            kind: "ais-track",
            vesselId:
              vessel.vesselId,
          },
          geometry: {
            type: "LineString",
            coordinates:
              vessel.track,
          },
        }),
      ),

      ...plan.selectedAssets.map(
        (asset) => ({
          type: "Feature",
          properties: {
            kind: "response-asset",
            rank: asset.rank,
            name:
              asset.assetName,
            etaMinutes:
              asset.etaMinutes,
          },
          geometry: {
            type: "Point",
            coordinates: [
              asset.longitude,
              asset.latitude,
            ],
          },
        }),
      ),

      ...plan.marineRoutes.map(
        (route) => ({
          type: "Feature",
          properties: {
            kind:
              "marine-deployment-route",
            rank: route.rank,
            distanceKm:
              route.distanceKm,
          },
          geometry: {
            type: "LineString",
            coordinates:
              route.coordinates,
          },
        }),
      ),
    ],
  };
}

/*
 * Exported only so the existing page can continue using the same
 * default incident flow. The page may still let the operator edit
 * these values.
 */
export const demoIncident =
  DEMO_INCIDENT;
