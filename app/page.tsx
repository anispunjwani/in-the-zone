"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronLeft, Database, Filter, Info, LoaderCircle, MapPin, Search, Sparkles, TrainFront, X } from "lucide-react";
import { TransitOpportunityMap } from "@/components/map/TransitOpportunityMap";
import { RoutePills } from "@/components/station/RoutePills";
import { BuildingSchematic } from "@/components/scenario/BuildingSchematic";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { stationRepository, parcelRepository } from "@/lib/dataProviders";
import { calculateScenario, calculateStationSummary, formatNumber } from "@/services/scenarios";
import type { CandidateParcel, ParcelDataSource, ScenarioIntensity, SubwayStation } from "@/types/domain";

const FEATURED = ["Broadway Junction", "Atlantic Av-Barclays Ctr", "Queensboro Plaza", "149 St-Hostos", "Myrtle-Wyckoff Avs", "Jamaica Center-Parsons/Archer"];
const FILTERS = ["Parking", "Auto Services", "Storage", "Gas Station", "Vacant Land", "Low-Density Commercial"];
const filterMatch: Record<string, string[]> = { Parking: ["Surface Parking"], "Auto Services": ["Auto Repair"], Storage: ["Storage Facility"], "Gas Station": ["Gas Station"], "Vacant Land": ["Vacant Land"], "Low-Density Commercial": ["Low-Density Commercial", "Warehouse"] };

function Stat({ value, label }: { value: string | number; label: string }) {
  return <div><strong className="block text-xl font-extrabold tracking-tight text-slate-950">{value}</strong><span className="text-xs leading-tight text-slate-500">{label}</span></div>;
}

export default function Home() {
  const [stations, setStations] = useState<SubwayStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<SubwayStation | null>(null);
  const [parcels, setParcels] = useState<CandidateParcel[]>([]);
  const [parcelSource, setParcelSource] = useState<ParcelDataSource | null>(null);
  const [parcelSourceLabel, setParcelSourceLabel] = useState("");
  const [parcelsLoading, setParcelsLoading] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<CandidateParcel | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SubwayStation[]>([]);
  const [radius, setRadius] = useState(0.25);
  const [filters, setFilters] = useState(new Set(FILTERS));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [intensity, setIntensity] = useState<ScenarioIntensity>("medium");

  useEffect(() => { stationRepository.getAllStations().then((all) => { setStations(all); setSelectedStation(all.find((station) => station.name === "Broadway Junction") ?? all[0]); }); }, []);
  useEffect(() => {
    if (!selectedStation) return;
    let active = true;
    setSelectedParcel(null);
    setParcelsLoading(true);
    parcelRepository.getParcelsNearStation(selectedStation, radius).then((result) => {
      if (!active) return;
      setParcels(result.parcels);
      setParcelSource(result.source);
      setParcelSourceLabel(result.sourceLabel);
      setParcelsLoading(false);
    });
    return () => { active = false; };
  }, [selectedStation, radius]);
  useEffect(() => { const timer = window.setTimeout(() => stationRepository.searchStations(query).then(setSearchResults), 120); return () => window.clearTimeout(timer); }, [query]);

  const visibleParcels = useMemo(() => parcels.filter((parcel) => [...filters].some((filter) => filterMatch[filter].includes(parcel.currentUse))), [parcels, filters]);
  const summary = useMemo(() => calculateStationSummary(visibleParcels), [visibleParcels]);
  const scenario = selectedParcel ? calculateScenario(selectedParcel.lotAreaSqFt, intensity) : null;
  const featured = FEATURED.map((name) => stations.find((station) => station.name === name)).filter((station): station is SubwayStation => Boolean(station));

  const chooseStation = (station: SubwayStation) => { setSelectedStation(station); setQuery(""); setSearchResults([]); };
  const toggleFilter = (filter: string) => setFilters((current) => { const next = new Set(current); if (next.has(filter)) next.delete(filter); else next.add(filter); return next; });

  return (
    <main className="min-h-screen bg-[#edf3f2] text-slate-900">
      <header className="relative z-20 border-b border-[#b9cbc7] bg-[#f8fbfa] px-4 py-3 lg:px-6">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-3">
          <div className="mr-auto flex min-w-[280px] items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#123d35] text-[#f4c14c]"><Building2 size={24} strokeWidth={2.4} /></div>
            <div><h1 className="font-display text-lg font-extrabold leading-tight tracking-[-0.03em] text-[#123d35] sm:text-xl">From Car Washes to Community</h1><p className="text-xs font-medium text-slate-500">NYC Transit Land Opportunity Explorer</p></div>
          </div>
          <div className="relative order-3 w-full sm:order-none sm:w-[370px]">
            <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-xl border border-[#b9cbc7] bg-white pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[#168b6d] focus:ring-4 focus:ring-[#168b6d]/10" placeholder="Search a subway station…" aria-label="Search subway stations" />
            {query && <div className="absolute top-12 z-30 w-full overflow-hidden rounded-xl border border-[#b9cbc7] bg-white shadow-xl">{searchResults.length ? searchResults.map((station) => <button key={station.id} onClick={() => chooseStation(station)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-[#eef7f4]"><span><strong className="block text-sm">{station.name}</strong><small className="text-slate-500">{station.borough}</small></span><RoutePills routes={station.routes.slice(0, 4)} compact /></button>) : <p className="p-4 text-sm text-slate-500">No matching stations</p>}</div>}
          </div>
          <Button variant="outline" onClick={() => setFiltersOpen((value) => !value)} className="h-11 rounded-xl border-[#b9cbc7] bg-white"><Filter size={17} /> Filters <span className="rounded-full bg-[#123d35] px-1.5 py-0.5 text-[10px] text-white">{filters.size}</span></Button>
          <Dialog><DialogTrigger asChild><Button variant="outline" className="h-11 rounded-xl border-[#b9cbc7] bg-white"><Info size={17} /> About</Button></DialogTrigger><DialogContent className="max-w-2xl rounded-[24px]"><DialogHeader><DialogTitle className="font-display text-2xl text-[#123d35]">What else could exist near transit?</DialogTitle></DialogHeader><div className="space-y-4 text-[15px] leading-7 text-slate-600"><p>This explorer combines official MTA station complexes with NYC MapPLUTO tax-lot geometry and property attributes.</p><div className="rounded-2xl bg-amber-50 p-4 text-amber-950"><strong className="block">Important methodology note</strong>Highlighted lots are selected by transparent land-use and building-class rules. They are not recommendations, appraisals, zoning determinations, or statements that a site is available for redevelopment.</div><p>Development capacity remains an illustrative scenario. The radius is straight-line distance, not a pedestrian-network walkshed.</p><p className="text-sm"><a className="font-bold text-[#126b55] underline" href="https://data.ny.gov/Transportation/MTA-Subway-Stations-and-Complexes/5f5g-n3cz" target="_blank" rel="noreferrer">MTA station source</a> · <a className="font-bold text-[#126b55] underline" href="https://www.nyc.gov/content/planning/pages/resources/datasets/mappluto-pluto-change" target="_blank" rel="noreferrer">NYC MapPLUTO source</a></p></div></DialogContent></Dialog>
        </div>
      </header>

      {filtersOpen && <section className="relative z-10 border-b border-[#b9cbc7] bg-white px-4 py-3 shadow-sm lg:px-6"><div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-4"><span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Candidate uses</span>{FILTERS.map((filter) => <label key={filter} className="flex cursor-pointer items-center gap-2 text-sm font-medium"><Checkbox checked={filters.has(filter)} onCheckedChange={() => toggleFilter(filter)} />{filter}</label>)}<button className="ml-auto text-slate-400 hover:text-slate-900" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={19} /></button></div></section>}

      <div className="mx-auto grid max-w-[1700px] gap-4 p-4 lg:h-[calc(100vh-69px)] lg:grid-cols-[minmax(0,2.05fr)_minmax(355px,0.95fr)] lg:p-5">
        <section className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-[#b9cbc7] bg-white p-2 shadow-[0_18px_50px_rgba(29,61,54,0.12)] lg:min-h-0">
          <TransitOpportunityMap stations={stations} selectedStation={selectedStation} parcels={visibleParcels} selectedParcel={selectedParcel} radiusMiles={radius} parcelSource={parcelSource} onSelectStation={chooseStation} onSelectParcel={setSelectedParcel} />
          <div className="absolute left-5 top-5 w-[min(330px,calc(100%-40px))] rounded-2xl border border-white/80 bg-white/94 p-4 shadow-lg backdrop-blur">
            <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#168b6d]">Featured stations</span><TrainFront size={17} className="text-[#168b6d]" /></div>
            <div className="grid gap-1.5">{featured.map((station) => <button key={station.id} onClick={() => chooseStation(station)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold transition ${selectedStation?.id === station.id ? "bg-[#123d35] text-white" : "hover:bg-[#eaf3f1]"}`}><span className="truncate">{station.name}</span><RoutePills routes={station.routes.slice(0, 3)} compact /></button>)}</div>
          </div>
          <div className="absolute right-5 top-5 rounded-2xl border border-white/80 bg-white/94 p-2 shadow-lg backdrop-blur">
            <p className="px-2 pb-1 pt-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Search radius</p>
            <div className="flex gap-1">{[0.125, 0.25, 0.5].map((value) => <button key={value} onClick={() => setRadius(value)} className={`rounded-lg px-2.5 py-2 text-xs font-bold ${radius === value ? "bg-[#168b6d] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{value === 0.125 ? "⅛" : value === 0.25 ? "¼" : "½"} mi</button>)}</div>
            <p aria-live="polite" className="flex items-center gap-1 px-2 pb-1 pt-2 text-[11px] font-semibold text-[#126b55]">{parcelsLoading && <LoaderCircle size={12} className="animate-spin" />} {parcelsLoading ? "Loading city data…" : `${visibleParcels.length} sites inside the circle`}</p>
          </div>
        </section>

        <aside className="min-h-[600px] overflow-y-auto rounded-[28px] border border-[#b9cbc7] bg-[#f8fbfa] shadow-[0_18px_50px_rgba(29,61,54,0.09)] lg:min-h-0">
          {!selectedStation ? <div className="grid h-full place-items-center p-10 text-center"><div><MapPin className="mx-auto mb-4 text-[#168b6d]" size={38} /><h2 className="font-display text-2xl font-bold">Select a subway station</h2><p className="mt-2 text-slate-500">Explore nearby illustrative land-use opportunities.</p></div></div> : !selectedParcel ? (
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#168b6d]">Station overview · {selectedStation.borough}</p><h2 className="font-display text-3xl font-black leading-tight tracking-[-0.04em] text-[#123d35]">{selectedStation.name}</h2></div><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#dceee9] text-[#168b6d]"><TrainFront /></div></div>
              <RoutePills routes={selectedStation.routes} />
              <div className={`my-6 rounded-2xl border px-4 py-3 text-sm ${parcelSource === "mappluto" ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-amber-300 bg-amber-50 text-amber-950"}`}><div className="flex items-center gap-2 font-extrabold"><Database size={16} />{parcelSource === "mappluto" ? "Real station and tax-lot data" : "Official station · parcel fallback"}</div><p className="mt-1 text-xs leading-5">{parcelSource === "mappluto" ? `${parcelSourceLabel}. Candidate status is rule-based; capacity remains illustrative.` : "The live MapPLUTO layer is unavailable, so clearly labeled demonstration parcels are shown."}</p></div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Within {radius === 0.125 ? "⅛" : radius === 0.25 ? "¼" : "½"} mile</p>
              <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white p-4 shadow-sm"><Stat value={summary.candidateParcelCount} label="candidate parcels" /></div><div className="rounded-2xl bg-white p-4 shadow-sm"><Stat value={`${(summary.candidateLandAreaSqFt / 43560).toFixed(1)} ac`} label="candidate land" /></div><div className="rounded-2xl bg-white p-4 shadow-sm"><Stat value={summary.autoOrientedCount} label="auto-oriented uses" /></div><div className="rounded-2xl bg-white p-4 shadow-sm"><Stat value={summary.storageParkingCount} label="storage / parking sites" /></div></div>
              <div className="mt-5 rounded-[22px] bg-[#123d35] p-5 text-white"><div className="mb-3 flex items-center gap-2 text-[#8ed6c3]"><Sparkles size={18} /><span className="text-xs font-extrabold uppercase tracking-[0.15em]">Illustrative capacity</span></div><p className="font-display text-4xl font-black tracking-[-0.05em]">{formatNumber(summary.lowCapacityUnits)}–{formatNumber(summary.highCapacityUnits)}</p><p className="mt-1 text-sm text-[#c8ded8]">potential homes across visible candidate sites</p></div>
              <div className="mt-6"><p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Select a parcel</p><div className="grid gap-2">{visibleParcels.slice(0, 6).map((parcel) => <button key={parcel.id} onClick={() => setSelectedParcel(parcel)} className="flex items-center justify-between rounded-xl border border-[#d1ddda] bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-[#168b6d] hover:shadow-md"><span><strong className="block text-sm">{parcel.currentUse}</strong><small className="text-slate-500">{parcel.address} · {parcel.distanceFeet} ft</small></span><MapPin size={17} className="text-amber-600" /></button>)}</div></div>
            </div>
          ) : scenario && (
            <div className="p-6">
              <button onClick={() => setSelectedParcel(null)} className="mb-5 flex items-center gap-1 text-sm font-bold text-[#168b6d] hover:underline"><ChevronLeft size={18} /> Back to station overview</button>
              <div className="mb-3 flex items-center justify-between"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#168b6d]">Parcel details</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${selectedParcel.dataSource === "mappluto" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{selectedParcel.dataSource === "mappluto" ? "MapPLUTO record" : "Illustrative fallback"}</span></div>
              <h2 className="font-display text-2xl font-black tracking-[-0.03em] text-[#123d35]">{selectedParcel.address}</h2><p className="mt-1 text-sm text-slate-500">{selectedParcel.distanceFeet} ft straight-line distance from {selectedStation.name}</p>
              <section className="mt-6"><h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">Existing site</h3><div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-[#d1ddda] bg-white p-5"><Stat value={selectedParcel.currentUse} label="rule-based category" /><Stat value={selectedParcel.zoning.replace("Illustrative ", "")} label={selectedParcel.dataSource === "mappluto" ? "zoning district" : "illustrative zoning"} /><Stat value={`${formatNumber(selectedParcel.lotAreaSqFt)} sf`} label="lot area" /><Stat value={selectedParcel.currentFAR.toFixed(1)} label="existing built FAR" /><Stat value={`${formatNumber(selectedParcel.existingBuildingAreaSqFt)} sf`} label="building area" /><Stat value={`${selectedParcel.distanceFeet} ft`} label="straight-line distance" /></div></section>
              <section className="mt-6"><div className="mb-3 flex items-end justify-between"><div><h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">What could this site become?</h3><p className="mt-1 text-sm text-slate-500">Choose an illustrative intensity.</p></div></div><div className="mb-4 grid grid-cols-3 rounded-xl bg-[#dfeae7] p-1">{(["low", "medium", "high"] as ScenarioIntensity[]).map((value) => <button key={value} onClick={() => setIntensity(value)} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize transition ${intensity === value ? "bg-white text-[#123d35] shadow-sm" : "text-slate-500"}`}>{value}</button>)}</div>
                <BuildingSchematic scenario={scenario} />
                <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-[22px] border border-[#b9cbc7]"><div className="bg-white p-4"><p className="mb-4 text-xs font-black uppercase tracking-[0.17em] text-slate-400">Today</p><p className="text-lg font-black">{selectedParcel.currentUse}</p><p className="mt-3 text-sm text-slate-500">{formatNumber(selectedParcel.existingBuildingAreaSqFt)} sf building</p><p className="text-sm text-slate-500">FAR {selectedParcel.currentFAR.toFixed(1)}</p></div><div className="bg-[#123d35] p-4 text-white"><p className="mb-4 text-xs font-black uppercase tracking-[0.17em] text-[#8ed6c3]">Potential scenario</p><p className="text-3xl font-black">{scenario.estimatedHousingUnits}</p><p className="text-sm text-[#c8ded8]">estimated homes</p><p className="mt-2 text-sm">{scenario.estimatedStories} stories · FAR {scenario.hypotheticalFAR}</p></div></div>
                <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-3"><strong className="block">{formatNumber(scenario.estimatedCommercialSqFt)} sf</strong><span className="text-xs text-slate-500">commercial space</span></div><div className="rounded-xl bg-white p-3"><strong className="block">{formatNumber(scenario.estimatedCommunitySqFt)} sf</strong><span className="text-xs text-slate-500">community space</span></div></div>
                <details className="mt-4 rounded-xl border border-[#d1ddda] bg-white p-4 text-sm text-slate-600"><summary className="cursor-pointer font-bold text-slate-900">Methodology & assumptions</summary><p className="mt-3 leading-6">Gross floor area equals lot area × hypothetical FAR. Residential capacity assumes 850 gross square feet per home. Community and commercial uses receive 15–25% of floor area depending on intensity.</p></details>
                <p className="mt-4 text-xs leading-5 text-slate-500">Hypothetical redevelopment scenario for demonstration purposes. This is not a zoning determination.</p>
              </section>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
