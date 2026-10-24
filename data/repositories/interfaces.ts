import type { ParcelSearchResult, SubwayStation } from "@/types/domain";

export interface StationRepository {
  getAllStations(): Promise<SubwayStation[]>;
  getStationById(id: string): Promise<SubwayStation | null>;
  searchStations(query: string): Promise<SubwayStation[]>;
}

export interface ParcelRepository {
  getParcelsNearStation(station: SubwayStation, radiusMiles: number): Promise<ParcelSearchResult>;
}

export interface ZoningRepository {
  getZoningForParcel(parcelId: string): Promise<string | null>;
}
