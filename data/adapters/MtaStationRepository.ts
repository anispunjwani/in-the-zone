import stationSnapshot from "@/data/generated/stations.json";
import type { StationRepository } from "@/data/repositories/interfaces";
import type { SubwayStation } from "@/types/domain";

const stations = stationSnapshot as SubwayStation[];

export class MtaStationRepository implements StationRepository {
  async getAllStations() { return stations; }
  async getStationById(id: string) { return stations.find((station) => station.id === id) ?? null; }
  async searchStations(query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return stations
      .filter((station) => `${station.name} ${station.borough} ${station.routes.join(" ")}`.toLowerCase().includes(needle))
      .slice(0, 8);
  }
}
