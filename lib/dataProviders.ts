import { MtaStationRepository } from "@/data/adapters/MtaStationRepository";
import { MapPlutoParcelRepository } from "@/data/adapters/MapPlutoParcelRepository";
import { MockZoningRepository } from "@/data/adapters/MockZoningRepository";

export const stationRepository = new MtaStationRepository();
export const parcelRepository = new MapPlutoParcelRepository();
export const zoningRepository = new MockZoningRepository();
