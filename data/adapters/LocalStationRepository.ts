import { RAW_STATIONS } from "@/data/mock/stations";
import type { StationRepository } from "@/data/repositories/interfaces";
import type { SubwayStation } from "@/types/domain";

export function normalizeStationData(row: (typeof RAW_STATIONS)[number]): SubwayStation {
  const [id, name, latitude, longitude, routeString, borough] = row;
  return { id, name, latitude, longitude, routes: routeString.split(","), borough };
}

export class LocalStationRepository implements StationRepository {
  private stations = RAW_STATIONS.map(normalizeStationData);
  async getAllStations() { return this.stations; }
  async getStationById(id: string) { return this.stations.find((station) => station.id === id) ?? null; }
  async searchStations(query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return this.stations
      .filter((station) => `${station.name} ${station.borough} ${station.routes.join(" ")}`.toLowerCase().includes(needle))
      .slice(0, 7);
  }
}

