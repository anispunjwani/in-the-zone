import type { ParcelRepository } from "@/data/repositories/interfaces";
import type { ParcelSearchResult, SubwayStation } from "@/types/domain";
import { MockParcelRepository } from "@/data/adapters/MockParcelRepository";

export class MapPlutoParcelRepository implements ParcelRepository {
  constructor(private fallback = new MockParcelRepository()) {}

  async getParcelsNearStation(station: SubwayStation, radiusMiles: number): Promise<ParcelSearchResult> {
    const params = new URLSearchParams({
      stationId: station.id,
      latitude: String(station.latitude),
      longitude: String(station.longitude),
      radiusMiles: String(radiusMiles),
    });

    try {
      const response = await fetch(`/api/parcels?${params.toString()}`);
      if (!response.ok) throw new Error(`MapPLUTO request failed (${response.status})`);
      return await response.json() as ParcelSearchResult;
    } catch {
      return this.fallback.getParcelsNearStation(station, radiusMiles);
    }
  }
}
