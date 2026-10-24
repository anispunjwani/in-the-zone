"use client";

import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent, Popup } from "maplibre-gl";
import type { Polygon } from "geojson";
import type { CandidateParcel, ParcelDataSource, SubwayStation } from "@/types/domain";

interface TransitOpportunityMapProps {
  stations: SubwayStation[];
  selectedStation: SubwayStation | null;
  parcels: CandidateParcel[];
  selectedParcel: CandidateParcel | null;
  radiusMiles: number;
  parcelSource: ParcelDataSource | null;
  onSelectStation: (station: SubwayStation) => void;
  onSelectParcel: (parcel: CandidateParcel) => void;
}

function circlePolygon(longitude: number, latitude: number, radiusMiles: number): Polygon {
  const points = Array.from({ length: 65 }, (_, index) => {
    const angle = (index / 64) * Math.PI * 2;
    const radiusFeet = radiusMiles * 5280;
    return [longitude + Math.cos(angle) * radiusFeet / (364000 * Math.cos(latitude * Math.PI / 180)), latitude + Math.sin(angle) * radiusFeet / 364000];
  });
  return { type: "Polygon", coordinates: [points] };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function TransitOpportunityMap(props: TransitOpportunityMapProps) {
  const { stations, selectedStation, parcels, selectedParcel, radiusMiles, parcelSource } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hoverPopupRef = useRef<Popup | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    import("maplibre-gl").then((MapLibre) => {
      if (cancelled || !containerRef.current) return;
      MapLibre.setWorkerUrl("/maplibre-gl-worker.mjs");
      const map = new MapLibre.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: { "osm-tiles": { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
          layers: [{ id: "osm-base", type: "raster", source: "osm-tiles", paint: { "raster-saturation": -0.7, "raster-contrast": 0.04, "raster-brightness-min": 0.16, "raster-brightness-max": 0.98 } }],
        },
        center: [-73.952, 40.735],
        zoom: 10.25,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new MapLibre.NavigationControl({ showCompass: false }), "bottom-left");
      map.addControl(new MapLibre.AttributionControl({ compact: true }), "bottom-right");

      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);

      map.on("load", () => {
        map.addSource("walking-radius", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "walking-radius-fill", type: "fill", source: "walking-radius", paint: { "fill-color": "#18a67a", "fill-opacity": 0.09 } });
        map.addLayer({ id: "walking-radius-line", type: "line", source: "walking-radius", paint: { "line-color": "#138363", "line-width": 2.5, "line-dasharray": [2, 2] } });

        map.addSource("candidate-parcels", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "parcel-fill", type: "fill", source: "candidate-parcels", paint: { "fill-color": ["case", ["==", ["get", "selected"], true], "#ff6b3d", "#f4b83f"], "fill-opacity": ["case", ["==", ["get", "selected"], true], 0.82, 0.57] } });
        map.addLayer({ id: "parcel-line", type: "line", source: "candidate-parcels", paint: { "line-color": ["case", ["==", ["get", "selected"], true], "#8d2d13", "#8c650a"], "line-width": ["case", ["==", ["get", "selected"], true], 3.5, 1.5] } });

        map.addSource("stations", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "station-halo", type: "circle", source: "stations", paint: { "circle-radius": ["case", ["==", ["get", "selected"], true], 10, 6], "circle-color": "#ffffff", "circle-opacity": 0.95 } });
        map.addLayer({ id: "station-points", type: "circle", source: "stations", paint: { "circle-radius": ["case", ["==", ["get", "selected"], true], 7, 4], "circle-color": ["case", ["==", ["get", "selected"], true], "#f4c14c", "#123d35"], "circle-stroke-color": "#123d35", "circle-stroke-width": ["case", ["==", ["get", "selected"], true], 2, 0] } });

        map.on("click", "station-points", (event: MapLayerMouseEvent) => {
          const id = String(event.features?.[0]?.properties?.id ?? "");
          const station = propsRef.current.stations.find((item) => item.id === id);
          if (station) propsRef.current.onSelectStation(station);
        });
        map.on("click", "parcel-fill", (event: MapLayerMouseEvent) => {
          const id = String(event.features?.[0]?.properties?.id ?? "");
          const parcel = propsRef.current.parcels.find((item) => item.id === id);
          if (parcel) propsRef.current.onSelectParcel(parcel);
        });
        map.on("mouseenter", "station-points", (event: MapLayerMouseEvent) => {
          map.getCanvas().style.cursor = "pointer";
          const properties = event.features?.[0]?.properties;
          if (!event.lngLat || !properties) return;
          hoverPopupRef.current?.remove();
          hoverPopupRef.current = new MapLibre.Popup({ closeButton: false, closeOnClick: false, offset: 10 }).setLngLat(event.lngLat).setHTML(`<div class="map-tooltip"><strong>${escapeHtml(String(properties.name))}</strong><small>${escapeHtml(String(properties.routes))}</small></div>`).addTo(map);
        });
        map.on("mouseenter", "parcel-fill", (event: MapLayerMouseEvent) => {
          map.getCanvas().style.cursor = "pointer";
          const properties = event.features?.[0]?.properties;
          if (!event.lngLat || !properties) return;
          hoverPopupRef.current?.remove();
          hoverPopupRef.current = new MapLibre.Popup({ closeButton: false, closeOnClick: false, offset: 10 }).setLngLat(event.lngLat).setHTML(`<div class="map-tooltip"><strong>${escapeHtml(String(properties.currentUse))}</strong><small>${escapeHtml(String(properties.address))}</small></div>`).addTo(map);
        });
        for (const layer of ["station-points", "parcel-fill"]) map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; hoverPopupRef.current?.remove(); });

        const current = propsRef.current;
        (map.getSource("stations") as GeoJSONSource).setData({
          type: "FeatureCollection",
          features: current.stations.map((station) => ({ type: "Feature", geometry: { type: "Point", coordinates: [station.longitude, station.latitude] }, properties: { id: station.id, name: station.name, routes: station.routes.join(" · "), selected: station.id === current.selectedStation?.id } })),
        });
        (map.getSource("candidate-parcels") as GeoJSONSource).setData({
          type: "FeatureCollection",
          features: current.parcels.map((parcel) => ({ type: "Feature", geometry: parcel.geometry, properties: { id: parcel.id, currentUse: parcel.currentUse, address: parcel.address, selected: parcel.id === current.selectedParcel?.id } })),
        });
        if (current.selectedStation) {
          (map.getSource("walking-radius") as GeoJSONSource).setData({ type: "Feature", properties: {}, geometry: circlePolygon(current.selectedStation.longitude, current.selectedStation.latitude, current.radiusMiles) });
          map.jumpTo({ center: [current.selectedStation.longitude, current.selectedStation.latitude], zoom: current.radiusMiles === 0.5 ? 13 : current.radiusMiles === 0.25 ? 14 : 14.8 });
        }
      });
    });
    return () => { cancelled = true; resizeObserver?.disconnect(); hoverPopupRef.current?.remove(); mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => (map.getSource("stations") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: stations.map((station) => ({ type: "Feature", geometry: { type: "Point", coordinates: [station.longitude, station.latitude] }, properties: { id: station.id, name: station.name, routes: station.routes.join(" · "), selected: station.id === selectedStation?.id } })) });
    if (map.loaded()) update(); else map.once("load", update);
  }, [stations, selectedStation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStation) return;
    const update = () => {
      (map.getSource("walking-radius") as GeoJSONSource | undefined)?.setData({ type: "Feature", properties: {}, geometry: circlePolygon(selectedStation.longitude, selectedStation.latitude, radiusMiles) });
      map.flyTo({ center: [selectedStation.longitude, selectedStation.latitude], zoom: radiusMiles === 0.5 ? 13 : radiusMiles === 0.25 ? 14 : 14.8, duration: 700, essential: true });
    };
    if (map.loaded()) update(); else map.once("load", update);
  }, [selectedStation, radiusMiles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => (map.getSource("candidate-parcels") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: parcels.map((parcel) => ({ type: "Feature", geometry: parcel.geometry, properties: { id: parcel.id, currentUse: parcel.currentUse, address: parcel.address, selected: parcel.id === selectedParcel?.id } })) });
    if (map.loaded()) update(); else map.once("load", update);
  }, [parcels, selectedParcel]);

  return (
    <div className="relative h-full min-h-[500px] overflow-hidden rounded-[26px] bg-[#dce8e7]">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-label="Interactive map of official NYC subway stations and nearby tax lots"
      />
      <div className="pointer-events-none absolute bottom-5 left-16 rounded-xl border border-white/70 bg-white/94 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm border-2 border-amber-700 bg-amber-400" />
        {parcels.length} {parcelSource === "mappluto" ? "MapPLUTO tax lots" : "illustrative sites"} in the radius
      </div>
    </div>
  );
}
