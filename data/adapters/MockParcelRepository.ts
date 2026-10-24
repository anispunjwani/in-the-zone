import type { ParcelRepository } from "@/data/repositories/interfaces";
import { generateCandidateParcels, normalizeParcelData } from "@/services/parcels";
import type { SubwayStation } from "@/types/domain";

export class MockParcelRepository implements ParcelRepository {
  async getParcelsNearStation(station: SubwayStation, radiusMiles: number) {
    const masterParcelSet = generateCandidateParcels(station, 0.5);
    const parcels = masterParcelSet
      .filter((parcel) => parcel.distanceFeet <= radiusMiles * 5280)
      .map(normalizeParcelData);
    return { parcels, source: "illustrative" as const, sourceLabel: "Illustrative fallback" };
  }
}
