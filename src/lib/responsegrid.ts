export type Severity = "Low" | "Moderate" | "High" | "Critical";

export type Incident = {
  latitude: number;
  longitude: number;
  spillArea: number;
  severity: Severity;
  maxAssets: number;
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
}

export type PlanAsset = Asset & {
  rank: number;
  distanceKm: number;
  etaMinutes: number;
  score: number;
  capability: "High" | "Medium" | "Low";
  reason: string;
};

export type Plan = {
  incident: Incident;
  selectedAssets: PlanAsset[];
  candidates: Array<Asset & { distanceKm: number; etaMinutes: number; score: number }>;
  requirements: { boomM: number; recoveryTph: number; crew: number };
  summary: {
    crew: number;
    recoveryTph: number;
    boomM: number;
    firstEta: number;
    maxEta: number;
    totalStorageT: number;
  };
  gap: { boomM: number; recoveryTph: number; crew: number; status: "Sufficient" | "Attention" };
  infrastructure: RegionalCapacity;
  environment: Environment;
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

type Region = { name: string; latitude: number; longitude: number; port: string };

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

const templates = [
  { type: "Pollution Response Vessel", category: "Vessel" as const, name: "Response Command", crew: 12, boom: 420, recovery: 8.5, storage: 90, speed: 15, radius: 110, specialization: "Offshore recovery", cost: 86000 },
  { type: "Oil Skimmer", category: "Equipment" as const, name: "Skimmer Unit", crew: 4, boom: 80, recovery: 5.5, storage: 28, speed: 8, radius: 45, specialization: "High-viscosity recovery", cost: 24000 },
  { type: "Patrol Vessel", category: "Vessel" as const, name: "Coastal Patrol", crew: 8, boom: 120, recovery: 1.2, storage: 12, speed: 22, radius: 160, specialization: "Survey and perimeter", cost: 31000 },
  { type: "Containment Boom Unit", category: "Equipment" as const, name: "Boom Team", crew: 6, boom: 680, recovery: 0, storage: 0, speed: 0, radius: 40, specialization: "Rapid containment", cost: 18000 },
];

export const assets: Asset[] = regions.flatMap((region, regionIndex) =>
  templates.map((template, templateIndex) => ({
    assetId: `RG-${String(regionIndex + 1).padStart(2, "0")}-${templateIndex + 1}`,
    assetName: `${template.name} ${region.name}`,
    assetType: template.type,
    category: template.category,
    latitude: region.latitude + (templateIndex - 1.5) * 0.035,
    longitude: region.longitude + (templateIndex - 1.5) * 0.04,
    region: region.name,
    status: (regionIndex % 7 === 0 && templateIndex === 3 ? "Standby" : regionIndex === 10 && templateIndex === 1 ? "Unavailable" : "Available") as Asset["status"],
    crewCount: template.crew + ((regionIndex + templateIndex) % 3),
    boomsM: template.boom + ((regionIndex * 20 + templateIndex * 15) % 90),
    skimmerCapacityTph: Number((template.recovery + ((regionIndex + templateIndex) % 4) * 0.4).toFixed(1)),
    storageCapacityT: template.storage + ((regionIndex * 4 + templateIndex * 3) % 18),
    speedKnots: template.speed,
    responseRadiusKm: template.radius,
    specialization: template.specialization,
    deploymentCost: template.cost + regionIndex * 1200,
  })),
);

const severityMultiplier: Record<Severity, number> = { Low: 0.65, Moderate: 0.9, High: 1.2, Critical: 1.55 };

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const earthRadius = 6371;
  const latitudeDelta = ((bLat - aLat) * Math.PI) / 180;
  const longitudeDelta = ((bLng - aLng) * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getEnvironment(latitude: number, longitude: number): Environment {
  const nearWesternCoast = longitude < 77;
  return {
    available: true,
    wind: nearWesternCoast ? "18 km/h" : "14 km/h",
    windDirection: nearWesternCoast ? "WNW" : "ENE",
    wave: nearWesternCoast ? "1.4 m" : "1.1 m",
    waveDirection: nearWesternCoast ? "NW" : "E",
    current: nearWesternCoast ? "0.7 kn SW" : "0.5 kn E",
  };
}

export function getInfrastructure(latitude: number, longitude: number): RegionalCapacity {
  const region = regions.reduce((closest, candidate) =>
    haversineKm(latitude, longitude, candidate.latitude, candidate.longitude) < haversineKm(latitude, longitude, closest.latitude, closest.longitude) ? candidate : closest,
  );
  const regionalAssets = assets.filter((asset) => asset.region === region.name);
  return {
    region: region.name,
    nearestPort: region.port,
    portDistanceKm: Number(haversineKm(latitude, longitude, region.latitude, region.longitude).toFixed(1)),
    responseStations: 2 + (regions.indexOf(region) % 3),
    supportFacilities: 3 + (regions.indexOf(region) % 4),
    vessels: regionalAssets.filter((asset) => asset.category === "Vessel" && asset.status !== "Unavailable").length,
    patrol: regionalAssets.filter((asset) => asset.assetType === "Patrol Vessel" && asset.status !== "Unavailable").length,
    workBoats: 1 + (regions.indexOf(region) % 3),
    skimmers: regionalAssets.filter((asset) => asset.assetType === "Oil Skimmer" && asset.status !== "Unavailable").length,
    boomM: regionalAssets.reduce((sum, asset) => sum + (asset.status === "Unavailable" ? 0 : asset.boomsM), 0),
    storageT: regionalAssets.reduce((sum, asset) => sum + (asset.status === "Unavailable" ? 0 : asset.storageCapacityT), 0),
    crew: regionalAssets.reduce((sum, asset) => sum + (asset.status === "Unavailable" ? 0 : asset.crewCount), 0),
  };
}

export function calculatePlan(incident: Incident): Plan {
  const multiplier = severityMultiplier[incident.severity];
  const requirements = {
    boomM: Math.ceil(incident.spillArea * 180 * multiplier),
    recoveryTph: Number((incident.spillArea * 2.7 * multiplier).toFixed(1)),
    crew: Math.ceil(incident.spillArea * 4.5 * multiplier),
  };
  const candidates = assets
    .map((asset) => {
      const distanceKm = haversineKm(incident.latitude, incident.longitude, asset.latitude, asset.longitude);
      const etaMinutes = asset.speedKnots > 0 ? Math.max(8, Math.round((distanceKm / (asset.speedKnots * 1.852)) * 60)) : Math.round(distanceKm * 1.8 + 25);
      const proximity = Math.max(0, 34 - distanceKm * 0.35);
      const capability = Math.min(27, asset.skimmerCapacityTph * 2.2 + asset.boomsM / 70 + asset.storageCapacityT / 24);
      const readiness = asset.status === "Available" ? 18 : asset.status === "Standby" ? 8 : 0;
      const match = incident.severity === "Critical" && asset.category === "Vessel" ? 10 : asset.assetType === "Containment Boom Unit" ? 8 : 3;
      const score = Math.max(0, Math.min(100, proximity + capability + readiness + match - etaMinutes * 0.06 - asset.deploymentCost / 18000));
      return { ...asset, distanceKm: Number(distanceKm.toFixed(1)), etaMinutes, score: Number(score.toFixed(1)) };
    })
    .filter((asset) => asset.status !== "Unavailable")
    .sort((a, b) => b.score - a.score);

  const selected = candidates.slice(0, Math.max(1, Math.min(incident.maxAssets, candidates.length)));
  const selectedAssets = selected.map((asset, index) => {
    const capability: PlanAsset["capability"] = asset.skimmerCapacityTph >= 6 || asset.boomsM >= 450 ? "High" : asset.skimmerCapacityTph >= 2 || asset.boomsM >= 150 ? "Medium" : "Low";
    const reason = asset.distanceKm <= 25
      ? `Closest ${capability.toLowerCase()}-capability unit with ${asset.boomsM.toLocaleString()} m boom and ${asset.skimmerCapacityTph.toFixed(1)} t/h recovery.`
      : `Strong ${asset.specialization.toLowerCase()} fit with ${asset.etaMinutes} min ETA and ${asset.crewCount} crew available.`;
    return { ...asset, rank: index + 1, capability, reason };
  });
  const summary = {
    crew: selectedAssets.reduce((sum, asset) => sum + asset.crewCount, 0),
    recoveryTph: Number(selectedAssets.reduce((sum, asset) => sum + asset.skimmerCapacityTph, 0).toFixed(1)),
    boomM: selectedAssets.reduce((sum, asset) => sum + asset.boomsM, 0),
    firstEta: selectedAssets.length ? Math.min(...selectedAssets.map((asset) => asset.etaMinutes)) : 0,
    maxEta: selectedAssets.length ? Math.max(...selectedAssets.map((asset) => asset.etaMinutes)) : 0,
    totalStorageT: selectedAssets.reduce((sum, asset) => sum + asset.storageCapacityT, 0),
  };
  return {
    incident,
    selectedAssets,
    candidates,
    requirements,
    summary,
    gap: { boomM: Math.max(0, requirements.boomM - summary.boomM), recoveryTph: Math.max(0, Number((requirements.recoveryTph - summary.recoveryTph).toFixed(1))), crew: Math.max(0, requirements.crew - summary.crew), status: requirements.boomM <= summary.boomM && requirements.recoveryTph <= summary.recoveryTph && requirements.crew <= summary.crew ? "Sufficient" : "Attention" },
    infrastructure: getInfrastructure(incident.latitude, incident.longitude),
    environment: getEnvironment(incident.latitude, incident.longitude),
  };
}

export function createGeoJson(plan: Plan) {
  return {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { kind: "incident", severity: plan.incident.severity }, geometry: { type: "Point", coordinates: [plan.incident.longitude, plan.incident.latitude] } },
      ...plan.selectedAssets.map((asset) => ({ type: "Feature", properties: { kind: "asset", rank: asset.rank, name: asset.assetName, etaMinutes: asset.etaMinutes }, geometry: { type: "Point", coordinates: [asset.longitude, asset.latitude] } })),
      ...plan.selectedAssets.map((asset) => ({ type: "Feature", properties: { kind: "deployment-line", rank: asset.rank }, geometry: { type: "LineString", coordinates: [[asset.longitude, asset.latitude], [plan.incident.longitude, plan.incident.latitude]] } })),
    ],
  };
}