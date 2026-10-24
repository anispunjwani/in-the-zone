import type { CandidateParcel, RedevelopmentScenario, ScenarioIntensity, StationSummary } from "@/types/domain";

const PRESETS = {
  low: { far: 3.2, nonResidential: 0.15, stories: 4 },
  medium: { far: 5.2, nonResidential: 0.2, stories: 7 },
  high: { far: 7.5, nonResidential: 0.25, stories: 10 },
} as const;

export function calculateScenario(lotAreaSqFt: number, intensity: ScenarioIntensity): RedevelopmentScenario {
  const preset = PRESETS[intensity];
  const gross = Math.round((lotAreaSqFt * preset.far) / 100) * 100;
  const nonResidential = gross * preset.nonResidential;
  const community = Math.round((nonResidential * 0.34) / 100) * 100;
  const commercial = Math.round((nonResidential - community) / 100) * 100;
  const residential = gross - community - commercial;
  return {
    name: `${intensity[0].toUpperCase()}${intensity.slice(1)} Mixed-Use Transit Scenario`,
    hypotheticalFAR: preset.far,
    grossFloorAreaSqFt: gross,
    estimatedHousingUnits: Math.max(1, Math.floor(residential / 850)),
    estimatedCommercialSqFt: commercial,
    estimatedCommunitySqFt: community,
    estimatedStories: preset.stories,
  };
}

export function calculateStationSummary(parcels: CandidateParcel[]): StationSummary {
  const land = parcels.reduce((sum, parcel) => sum + parcel.lotAreaSqFt, 0);
  const autoUses = new Set(["Car Wash", "Auto Repair", "Gas Station"]);
  return {
    candidateParcelCount: parcels.length,
    candidateLandAreaSqFt: land,
    autoOrientedCount: parcels.filter((parcel) => autoUses.has(parcel.currentUse)).length,
    storageParkingCount: parcels.filter((parcel) => ["Storage Facility", "Surface Parking"].includes(parcel.currentUse)).length,
    lowCapacityUnits: parcels.reduce((sum, parcel) => sum + calculateScenario(parcel.lotAreaSqFt, "low").estimatedHousingUnits, 0),
    highCapacityUnits: parcels.reduce((sum, parcel) => sum + calculateScenario(parcel.lotAreaSqFt, "high").estimatedHousingUnits, 0),
  };
}

export function formatNumber(value: number) { return new Intl.NumberFormat("en-US").format(value); }

