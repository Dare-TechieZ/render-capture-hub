import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clipboard, Download, LocateFixed, RefreshCw, Ship, Waves, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OperationalMap } from "@/components/OperationalMap";
import { calculatePlan, createGeoJson, type Incident, type Plan, type Severity } from "@/lib/responsegrid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResponseGrid | Maritime Operations" },
      { name: "description", content: "Operational decision support for oil-spill response asset deployment." },
      { property: "og:title", content: "ResponseGrid | Maritime Operations" },
      { property: "og:description", content: "Coordinate containment, recovery and support assets around an active oil-spill incident." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResponseGrid,
});

const defaultIncident: Incident = { latitude: 19.05, longitude: 72.85, spillArea: 5.2, severity: "High", maxAssets: 6 };

function ResponseGrid() {
  const [incident, setIncident] = useState<Incident>(defaultIncident);
  const [plan, setPlan] = useState<Plan>(() => calculatePlan(defaultIncident));
  const [isCalculating, setIsCalculating] = useState(false);
  const [tacticalOpen, setTacticalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("08:42:16 UTC");

  const calculate = () => {
    setIsCalculating(true);
    window.setTimeout(() => {
      setPlan(calculatePlan(incident));
      setLastUpdated(new Date().toISOString().slice(11, 19) + " UTC");
      setIsCalculating(false);
    }, 260);
  };

  const tacticalGeoJson = useMemo(() => JSON.stringify(createGeoJson(plan), null, 2), [plan]);
  const tacticalText = useMemo(() => buildTacticalBrief(plan), [plan]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-header-border bg-header text-header-foreground">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-5 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center border border-header-mark-border bg-header-mark text-header-mark-foreground"><Ship className="h-5 w-5" /></div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em]">Blue Trace</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-header-muted">Maritime Operations</div>
            </div>
            <div className="hidden h-8 w-px bg-header-divider sm:block" />
            <div className="hidden sm:block">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-header-muted">Response Asset Optimization</div>
              <div className="text-lg font-semibold tracking-tight">ResponseGrid</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] uppercase tracking-[0.13em] text-header-muted md:inline">Operational decision support</span>
            <Button variant="header" size="sm" onClick={calculate} disabled={isCalculating}><RefreshCw className={isCalculating ? "animate-spin" : ""} /> Recalculate</Button>
            <Button variant="headerAction" size="sm" onClick={() => setTacticalOpen(true)}><ArrowRight /> Tactical Brief</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-5 py-5 lg:px-8">
        <section className="flex flex-col justify-between gap-3 border-b border-border pb-4 md:flex-row md:items-end">
          <div>
            <p className="section-kicker">Response Asset Optimization</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Active incident coordination</h1>
            <p className="mt-1 text-sm text-muted-foreground">Coordinate containment, recovery and support assets around an active oil-spill incident.</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="status-dot status-dot-green" /> Resource register online <span className="mx-1 text-border">|</span> Updated {lastUpdated}</div>
        </section>

        <section className="border border-border bg-card p-4 shadow-panel">
          <div className="mb-3 flex items-center justify-between"><div><p className="section-kicker">Incident Parameters</p><p className="mt-1 text-xs text-muted-foreground">Set the planning extent and response posture.</p></div><LocateFixed className="h-4 w-4 text-rust" /></div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
            <Field label="Latitude"><Input type="number" step="0.01" value={incident.latitude} onChange={(event) => setIncident({ ...incident, latitude: Number(event.target.value) })} /></Field>
            <Field label="Longitude"><Input type="number" step="0.01" value={incident.longitude} onChange={(event) => setIncident({ ...incident, longitude: Number(event.target.value) })} /></Field>
            <Field label="Spill area (km²)"><Input type="number" min="0.1" step="0.1" value={incident.spillArea} onChange={(event) => setIncident({ ...incident, spillArea: Number(event.target.value) })} /></Field>
            <Field label="Severity"><Select value={incident.severity} onValueChange={(value) => setIncident({ ...incident, severity: value as Severity })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Low", "Moderate", "High", "Critical"].map((severity) => <SelectItem key={severity} value={severity}>{severity}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Max assets"><Input type="number" min="1" max="20" value={incident.maxAssets} onChange={(event) => setIncident({ ...incident, maxAssets: Math.max(1, Math.min(20, Number(event.target.value))) })} /></Field>
            <Button className="h-9 self-end" onClick={calculate} disabled={isCalculating}>{isCalculating ? "Calculating" : "Calculate Plan"}<ArrowRight /></Button>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(360px,0.85fr)]">
          <section className="min-w-0 border border-border bg-card shadow-panel">
            <SectionHeading title="Operational Map" subtitle="Incident & Asset Coverage" icon={<Waves />} action={<div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground"><Legend color="incident" label="Incident" /><Legend color="selected" label="Selected" /><Legend color="available" label="Available" /></div>} />
            <div className="map-frame"><OperationalMap plan={plan} /><div className="map-label"><span className="status-dot status-dot-red" /> Planning area · {plan.incident.spillArea.toFixed(1)} km²</div></div>
          </section>
          <aside className="space-y-4">
            <DeploymentPlan plan={plan} />
            <ResourceSummary plan={plan} />
            <EnvironmentPanel plan={plan} />
          </aside>
        </div>

        <CapacityPanel plan={plan} />
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"><ResourceGap plan={plan} /><TacticalPanel plan={plan} onOpen={() => setTacticalOpen(true)} /></div>
        <AssetTable plan={plan} />
      </main>
      {tacticalOpen && <TacticalModal plan={plan} brief={tacticalText} geoJson={tacticalGeoJson} onClose={() => setTacticalOpen(false)} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="field-label">{label}</span>{children}</label>; }
function SectionHeading({ title, subtitle, icon, action }: { title: string; subtitle: string; icon?: React.ReactNode; action?: React.ReactNode }) { return <div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><span className="text-rust">{icon}</span><div><p className="section-kicker">{title}</p><p className="text-[11px] text-muted-foreground">{subtitle}</p></div></div>{action}</div>; }
function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-1.5"><i className={`legend-dot legend-${color}`} />{label}</span>; }

function DeploymentPlan({ plan }: { plan: Plan }) { return <section className="border border-border bg-card shadow-panel"><SectionHeading title="Deployment Plan" subtitle="Recommended Assets" icon={<Ship />} /><div className="divide-y divide-border">{plan.selectedAssets.map((asset) => <div className="p-3" key={asset.assetId}><div className="flex items-start gap-3"><div className="rank-box">{String(asset.rank).padStart(2, "0")}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="truncate text-sm font-semibold">{asset.assetName}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{asset.assetType}</p></div><span className={`status-tag status-${asset.status.toLowerCase()}`}>{asset.status}</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-[11px]"><Metric label="ETA" value={`${asset.etaMinutes} min`} /><Metric label="Distance" value={`${asset.distanceKm} km`} /><Metric label="Capability" value={asset.capability} /></div><p className="mt-2 text-[11px] leading-4 text-muted-foreground"><span className="font-semibold text-foreground">Why selected: </span>{asset.reason}</p></div></div></div>)}</div></section>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><div className="uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-0.5 font-semibold text-foreground">{value}</div></div>; }
function ResourceSummary({ plan }: { plan: Plan }) { const values = [["Assets", String(plan.selectedAssets.length)], ["Crew", String(plan.summary.crew)], ["Recovery", `${plan.summary.recoveryTph} t/h`], ["Boom", `${plan.summary.boomM.toLocaleString()} m`], ["First ETA", `${plan.summary.firstEta} min`], ["Max ETA", `${plan.summary.maxEta} min`]]; return <section className="border border-border bg-card p-4 shadow-panel"><p className="section-kicker">Resource Summary</p><div className="mt-3 grid grid-cols-3 gap-y-4">{values.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div></section>; }
function EnvironmentPanel({ plan }: { plan: Plan }) { return <section className="border border-border bg-card p-4 shadow-panel"><div className="flex items-center justify-between"><div><p className="section-kicker">Environment</p><p className="mt-1 text-[11px] text-muted-foreground">Current Conditions</p></div><span className="status-tag status-available">Available</span></div><div className="mt-3 grid grid-cols-2 gap-3"><Metric label="Wind" value={plan.environment.wind} /><Metric label="Direction" value={plan.environment.windDirection} /><Metric label="Wave" value={plan.environment.wave} /><Metric label="Wave direction" value={plan.environment.waveDirection} /><Metric label="Current" value={plan.environment.current} /></div></section>; }
function CapacityPanel({ plan }: { plan: Plan }) { const cells = [["Pollution response vessels", plan.infrastructure.vessels], ["Patrol vessels", plan.infrastructure.patrol], ["Work boats", plan.infrastructure.workBoats], ["Oil skimmers", plan.infrastructure.skimmers], ["Containment boom", `${plan.infrastructure.boomM.toLocaleString()} m`], ["Storage capacity", `${plan.infrastructure.storageT} t`], ["Available crew", plan.infrastructure.crew], ["Response stations", plan.infrastructure.responseStations]]; return <section className="border border-border bg-card shadow-panel"><SectionHeading title="Regional Response Capacity" subtitle="Operational Resource Register · Regional view" icon={<LocateFixed />} action={<span className="text-[11px] text-muted-foreground">Nearest port: <b className="text-foreground">{plan.infrastructure.nearestPort}</b> · {plan.infrastructure.portDistanceKm} km</span>} /><div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4">{cells.map(([label, value]) => <div className="p-3" key={label}><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>)}</div></section>; }
function ResourceGap({ plan }: { plan: Plan }) { const rows = [["Containment boom", `${plan.requirements.boomM.toLocaleString()} m`, `${plan.summary.boomM.toLocaleString()} m`, plan.gap.boomM ? `${plan.gap.boomM.toLocaleString()} m` : "—"], ["Recovery capacity", `${plan.requirements.recoveryTph} t/h`, `${plan.summary.recoveryTph} t/h`, plan.gap.recoveryTph ? `${plan.gap.recoveryTph} t/h` : "—"], ["Crew", String(plan.requirements.crew), String(plan.summary.crew), plan.gap.crew ? String(plan.gap.crew) : "—"]]; return <section className="border border-border bg-card shadow-panel"><SectionHeading title="Resource Gap" subtitle="Required resources vs available resources" icon={<AlertTriangle />} /><div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Resource</th><th>Required</th><th>Available</th><th>Gap</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td className="font-medium">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td className={row[3] === "—" ? "text-green" : "text-rust font-semibold"}>{row[3]}</td></tr>)}</tbody></table></div><div className={`border-t border-border px-4 py-3 text-xs font-semibold ${plan.gap.status === "Sufficient" ? "text-green" : "text-rust"}`}>{plan.gap.status === "Sufficient" ? <CheckCircle2 className="mr-1 inline h-4 w-4" /> : <AlertTriangle className="mr-1 inline h-4 w-4" />}{plan.gap.status === "Sufficient" ? "Resource posture is sufficient for the current plan." : "Attention required before the full response posture can be met."}</div></section>; }
function TacticalPanel({ plan, onOpen }: { plan: Plan; onOpen: () => void }) { return <section className="border border-border bg-navy text-navy-foreground shadow-panel"><div className="flex items-center justify-between border-b border-navy-border px-4 py-3"><div><p className="section-kicker section-kicker-light">Tactical Operations</p><p className="mt-1 text-[11px] text-navy-muted">Low-bandwidth operator delivery</p></div><Clipboard className="h-4 w-4 text-navy-muted" /></div><div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs leading-5 text-navy-muted">A compact operational brief with essential geometry, deployment order and resource posture.</p><div className="mt-3 grid grid-cols-3 gap-3"><Metric label="Payload" value={`${new Blob([JSON.stringify(createGeoJson(plan))]).size} B`} /><Metric label="Layers" value="Minimal" /><Metric label="Imagery" value="Not included" /></div></div><Button variant="tactical" onClick={onOpen}>Open Tactical Brief <ArrowRight /></Button></div></section>; }
function AssetTable({ plan }: { plan: Plan }) { return <section className="border border-border bg-card shadow-panel"><SectionHeading title="Selected Asset Details" subtitle={`${plan.selectedAssets.length} ranked assets in the recommended deployment`} icon={<Ship />} /><div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Rank</th><th>Asset</th><th>Region</th><th>Distance</th><th>ETA</th><th>Boom</th><th>Recovery</th><th>Storage</th><th>Cost index</th></tr></thead><tbody>{plan.selectedAssets.map((asset) => <tr key={asset.assetId}><td><span className="rank-box rank-box-small">{asset.rank}</span></td><td><div className="font-semibold">{asset.assetName}</div><div className="text-[10px] text-muted-foreground">{asset.assetType}</div></td><td>{asset.region}</td><td>{asset.distanceKm} km</td><td>{asset.etaMinutes} min</td><td>{asset.boomsM.toLocaleString()} m</td><td>{asset.skimmerCapacityTph.toFixed(1)} t/h</td><td>{asset.storageCapacityT} t</td><td>₹{Math.round(asset.deploymentCost / 1000)}k</td></tr>)}</tbody></table></div></section>; }

function TacticalModal({ plan, brief, geoJson, onClose }: { plan: Plan; brief: string; geoJson: string; onClose: () => void }) { const download = (content: string, name: string, type: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }; return <div className="fixed inset-0 z-50 grid place-items-center bg-modal p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-auto border border-navy-border bg-navy text-navy-foreground shadow-modal"><div className="flex items-center justify-between border-b border-navy-border px-5 py-4"><div><p className="section-kicker section-kicker-light">Tactical Mode</p><h2 className="mt-1 text-xl font-semibold">Incident alert · {plan.incident.severity}</h2></div><Button variant="tacticalIcon" size="icon" onClick={onClose} aria-label="Close tactical brief"><X /></Button></div><div className="grid gap-5 p-5 md:grid-cols-[1fr_1.2fr]"><div className="space-y-4"><div className="border border-navy-border bg-navy-inset p-4"><p className="section-kicker section-kicker-light">Incident Alert</p><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><span className="text-navy-muted">Coordinates</span><b>{plan.incident.latitude.toFixed(4)}, {plan.incident.longitude.toFixed(4)}</b></div><div className="flex justify-between gap-4"><span className="text-navy-muted">Severity</span><b>{plan.incident.severity.toUpperCase()}</b></div><div className="flex justify-between gap-4"><span className="text-navy-muted">Spill area</span><b>{plan.incident.spillArea.toFixed(1)} km²</b></div><div className="flex justify-between gap-4"><span className="text-navy-muted">Recommended assets</span><b>{plan.selectedAssets.length}</b></div><div className="flex justify-between gap-4"><span className="text-navy-muted">First ETA</span><b>{plan.summary.firstEta} min</b></div></div></div><div><p className="section-kicker section-kicker-light">Deployment Order</p><div className="mt-2 space-y-2">{plan.selectedAssets.slice(0, 5).map((asset) => <div className="flex gap-3 text-xs" key={asset.assetId}><span className="font-bold text-rust">{asset.rank}.</span><span>{asset.assetName} · {asset.etaMinutes} min</span></div>)}</div></div></div><div><p className="section-kicker section-kicker-light">Operational Brief</p><pre className="mt-2 whitespace-pre-wrap border border-navy-border bg-navy-inset p-4 font-mono text-[11px] leading-5 text-navy-muted">{brief}</pre><p className="mt-4 section-kicker section-kicker-light">Tactical GeoJSON</p><pre className="mt-2 max-h-44 overflow-auto border border-navy-border bg-navy-inset p-4 font-mono text-[10px] leading-4 text-navy-muted">{geoJson}</pre></div></div><div className="flex flex-wrap gap-2 border-t border-navy-border px-5 py-4"><Button variant="tactical" onClick={() => navigator.clipboard.writeText(brief)}><Clipboard /> Copy Tactical Brief</Button><Button variant="tacticalOutline" onClick={() => download(geoJson, "responsegrid-tactical.geojson", "application/geo+json")}><Download /> Download GeoJSON</Button><Button variant="tacticalOutline" onClick={() => download(brief, "responsegrid-brief.txt", "text/plain")}><Download /> Download Brief</Button></div></div></div>; }
function buildTacticalBrief(plan: Plan) { return [`RESPONSEGRID / OPERATIONAL BRIEF`, `INCIDENT     ${plan.incident.latitude.toFixed(4)}, ${plan.incident.longitude.toFixed(4)}`, `SEVERITY     ${plan.incident.severity.toUpperCase()}`, `EXTENT       ${plan.incident.spillArea.toFixed(1)} km²`, `DEPLOYMENT   ${plan.selectedAssets.length} assets · first ETA ${plan.summary.firstEta} min`, `RESOURCE     ${plan.summary.boomM.toLocaleString()} m boom · ${plan.summary.recoveryTph} t/h recovery · ${plan.summary.crew} crew`, `GAP          ${plan.gap.boomM ? `${plan.gap.boomM} m containment boom` : plan.gap.recoveryTph ? `${plan.gap.recoveryTph} t/h recovery` : "None identified"}`, `ENVIRONMENT  Wind ${plan.environment.wind} ${plan.environment.windDirection} · Wave ${plan.environment.wave}`, `ACTION       ${plan.gap.status === "Sufficient" ? "Deploy ranked assets in order; maintain perimeter monitoring." : "Deploy ranked assets and source the identified resource gap."}`].join("\n"); }