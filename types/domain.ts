import type { Polygon } from "geojson";

export type ScenarioIntensity = "low" | "medium" | "high";

export interface SubwayStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
  borough: "Manhattan" | "Brooklyn" | "Queens" | "The Bronx" | "Staten Island";
  adaAccessible?: boolean;
  structureType?: string;
}

export type ParcelDataSource = "mappluto" | "illustrative";

export interface RedevelopmentScenario {
  name: string;
  hypotheticalFAR: number;
  grossFloorAreaSqFt: number;
  estimatedHousingUnits: number;
  estimatedCommercialSqFt: number;
  estimatedCommunitySqFt: number;
  estimatedStories: number;
}

export interface CandidateParcel {
  id: string;
  stationId: string;
  address: string;
  latitude: number;
  longitude: number;
  geometry: Polygon;
  lotAreaSqFt: number;
  currentUse: string;
  zoning: string;
  currentFAR: number;
  existingBuildingAreaSqFt: number;
  distanceFeet: number;
  opportunityFactors: string[];
  scenario: RedevelopmentScenario;
  dataSource: ParcelDataSource;
}

export interface ParcelSearchResult {
  parcels: CandidateParcel[];
  source: ParcelDataSource;
  sourceLabel: string;
}

export interface StationSummary {
  candidateParcelCount: number;
  candidateLandAreaSqFt: number;
  autoOrientedCount: number;
  storageParkingCount: number;
  lowCapacityUnits: number;
  highCapacityUnits: number;
}

export interface ExistingSite {
  address: string;
  currentUse: string;
  zoning: string;
  lotAreaSqFt: number;
  currentFAR: number;
  existingBuildingAreaSqFt: number;
  distanceFeet: number;
}
