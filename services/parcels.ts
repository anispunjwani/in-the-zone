import { calculateScenario } from "@/services/scenarios";
import type { CandidateParcel, SubwayStation } from "@/types/domain";

const USES = ["Car Wash", "Auto Repair", "Surface Parking", "Storage Facility", "Gas Station", "Low-Density Commercial", "Warehouse"];
const ZONES = ["Illustrative C8 District", "Illustrative M1 District", "Illustrative C4 District", "Illustrative R6/C2 Overlay"];

function hash(input: string) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) value = Math.imul(value ^ input.charCodeAt(index), 16777619);
  return value >>> 0;
}

function seeded(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthFeet = 20_902_231;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthFeet * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function generateCandidateParcels(station: SubwayStation, maxRadiusMiles: number): CandidateParcel[] {
  const random = seeded(hash(station.id));
  const count = 18 + Math.floor(random() * 5);
  const maxFeet = maxRadiusMiles * 5280;
  return Array.from({ length: count }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const distanceFeet = maxFeet * (0.22 + random() * 0.72);
    const latitude = station.latitude + Math.sin(angle) * (distanceFeet / 364000);
    const longitude = station.longitude + Math.cos(angle) * (distanceFeet / (364000 * Math.cos(station.latitude * Math.PI / 180)));
    const lotAreaSqFt = Math.round((6000 + random() * 16000) / 500) * 500;
    const width = 0.00035 + random() * 0.00025;
    const height = 0.00024 + random() * 0.0002;
    const currentUse = USES[Math.floor(random() * USES.length)];
    const currentFAR = Math.round((0.18 + random() * 0.72) * 10) / 10;
    const id = `${station.id}-parcel-${String(index + 1).padStart(2, "0")}`;
    return {
      id,
      stationId: station.id,
      address: `Illustrative Site ${String.fromCharCode(65 + index)}`,
      latitude,
      longitude,
      geometry: { type: "Polygon", coordinates: [[[longitude - width, latitude - height], [longitude + width, latitude - height], [longitude + width, latitude + height], [longitude - width, latitude + height], [longitude - width, latitude - height]]] },
      lotAreaSqFt,
      currentUse,
      zoning: ZONES[Math.floor(random() * ZONES.length)],
      currentFAR,
      existingBuildingAreaSqFt: Math.round((lotAreaSqFt * currentFAR) / 100) * 100,
      distanceFeet: calculateDistance(station.latitude, station.longitude, latitude, longitude),
      opportunityFactors: ["Near rapid transit", currentFAR < 0.6 ? "Low existing FAR" : "Large lot", ["Car Wash", "Auto Repair", "Gas Station"].includes(currentUse) ? "Auto-oriented use" : "Adaptable footprint"],
      scenario: calculateScenario(lotAreaSqFt, "medium"),
      dataSource: "illustrative",
    };
  });
}

export function normalizeParcelData(parcel: CandidateParcel): CandidateParcel { return { ...parcel }; }
