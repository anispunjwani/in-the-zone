import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const endpoint = "https://data.ny.gov/resource/5f5g-n3cz.json?$limit=1000";
const boroughs = { M: "Manhattan", Bk: "Brooklyn", Q: "Queens", Bx: "The Bronx", SI: "Staten Island" };
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(projectRoot, "data/generated/stations.json");

const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
if (!response.ok) throw new Error(`MTA station sync failed: ${response.status}`);
const rows = await response.json();
const stations = rows
  .map((row) => ({
    id: `mta-${row.complex_id}`,
    name: row.stop_name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    routes: String(row.daytime_routes || "").trim().split(/\s+/).filter(Boolean),
    borough: boroughs[row.borough],
    adaAccessible: row.ada === "1",
    structureType: row.structure_type,
  }))
  .filter((station) => station.name && station.borough && Number.isFinite(station.latitude) && Number.isFinite(station.longitude))
  .sort((a, b) => a.name.localeCompare(b.name) || a.borough.localeCompare(b.borough));

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, `${JSON.stringify(stations, null, 2)}\n`);
console.log(`Saved ${stations.length} official MTA station complexes to ${destination}`);
