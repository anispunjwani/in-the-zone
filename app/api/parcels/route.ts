import { NextRequest, NextResponse } from "next/server";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { calculateDistance } from "@/services/parcels";
import { calculateScenario } from "@/services/scenarios";
import type { CandidateParcel } from "@/types/domain";

const MAPPLUTO_QUERY = "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0/query";

interface MapPlutoProperties {
  BBL?: number;
  Address?: string;
  LandUse?: string;
  LotArea?: number;
  BldgArea?: number;
  BuiltFAR?: number;
  ZoneDist1?: string;
  NumBldgs?: number;
  BldgClass?: string;
}

function currentUse(properties: MapPlutoProperties) {
  const buildingClass = properties.BldgClass ?? "";
  if (["G1", "G6", "G7"].includes(buildingClass) || properties.LandUse === "10") return "Surface Parking";
  if (["G2", "G8", "G9"].includes(buildingClass)) return "Auto Repair";
  if (["G3", "G4", "G5"].includes(buildingClass)) return "Gas Station";
  if (buildingClass.startsWith("E")) return "Storage Facility";
  if (buildingClass.startsWith("F") || properties.LandUse === "06") return "Warehouse";
  if (buildingClass.startsWith("V") || properties.LandUse === "11") return "Vacant Land";
  return "Low-Density Commercial";
}

function polygonCenter(geometry: Polygon) {
  const points = geometry.coordinates.flat();
  const total = points.reduce((sum, [longitude, latitude]) => ({ longitude: sum.longitude + longitude, latitude: sum.latitude + latitude }), { longitude: 0, latitude: 0 });
  return { longitude: total.longitude / points.length, latitude: total.latitude / points.length };
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("latitude"));
  const longitude = Number(request.nextUrl.searchParams.get("longitude"));
  const radiusMiles = Math.min(0.5, Math.max(0.125, Number(request.nextUrl.searchParams.get("radiusMiles")) || 0.25));
  const stationId = request.nextUrl.searchParams.get("stationId") ?? "unknown";
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return NextResponse.json({ error: "Valid station coordinates are required." }, { status: 400 });

  const latitudeDelta = radiusMiles / 69;
  const longitudeDelta = radiusMiles / (69 * Math.cos(latitude * Math.PI / 180));
  const params = new URLSearchParams({
    where: "(LandUse IN ('05','06','07','10','11') OR BldgClass LIKE 'G%' OR BldgClass LIKE 'E%' OR BldgClass LIKE 'F%')",
    geometry: `${longitude - longitudeDelta},${latitude - latitudeDelta},${longitude + longitudeDelta},${latitude + latitudeDelta}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "BBL,Address,LandUse,LotArea,BldgArea,BuiltFAR,ZoneDist1,NumBldgs,BldgClass",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "2000",
    f: "geojson",
  });

  try {
    const response = await fetch(`${MAPPLUTO_QUERY}?${params.toString()}`, { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error(`MapPLUTO responded with ${response.status}`);
    const collection = await response.json() as FeatureCollection<Polygon, MapPlutoProperties>;
    const parcels = collection.features
      .filter((feature): feature is Feature<Polygon, MapPlutoProperties> => feature.geometry?.type === "Polygon")
      .map((feature) => {
        const properties = feature.properties ?? {};
        const center = polygonCenter(feature.geometry);
        const distanceFeet = calculateDistance(latitude, longitude, center.latitude, center.longitude);
        const lotAreaSqFt = Number(properties.LotArea) || 0;
        const builtFar = Number(properties.BuiltFAR) || 0;
        const use = currentUse(properties);
        const opportunityFactors = [
          "Inside the selected transit radius",
          builtFar < 0.75 ? "Low existing built FAR" : "Candidate land-use pattern",
          ["Surface Parking", "Auto Repair", "Gas Station"].includes(use) ? "Auto-oriented use" : "Adaptable site type",
        ];
        return {
          id: String(properties.BBL ?? feature.id ?? `${center.longitude}-${center.latitude}`),
          stationId,
          address: properties.Address?.trim() || `Tax lot ${properties.BBL ?? ""}`,
          latitude: center.latitude,
          longitude: center.longitude,
          geometry: feature.geometry,
          lotAreaSqFt,
          currentUse: use,
          zoning: properties.ZoneDist1 || "Not listed",
          currentFAR: builtFar,
          existingBuildingAreaSqFt: Number(properties.BldgArea) || 0,
          distanceFeet,
          opportunityFactors,
          scenario: calculateScenario(lotAreaSqFt, "medium"),
          dataSource: "mappluto" as const,
        } satisfies CandidateParcel;
      })
      .filter((parcel) => parcel.distanceFeet <= radiusMiles * 5280 && parcel.lotAreaSqFt >= 1000)
      .sort((a, b) => a.distanceFeet - b.distanceFeet)
      .slice(0, 150);

    return NextResponse.json({ parcels, source: "mappluto", sourceLabel: "NYC MapPLUTO live layer" }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "MapPLUTO request failed" }, { status: 502 });
  }
}
