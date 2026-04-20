import { useEffect, useMemo, useRef } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { type EarthLocation, EMOTION_COLOR } from "@/data/locations";
import { type ActivityPing } from "@/lib/presence";

interface EarthGlobeProps {
  locations: EarthLocation[];
  pings: ActivityPing[];
  onSelect: (loc: EarthLocation) => void;
  selectedId?: string | null;
  width: number;
  height: number;
}

const EarthGlobe = ({
  locations,
  pings,
  onSelect,
  selectedId,
  width,
  height,
}: EarthGlobeProps) => {
  const globeRef = useRef<GlobeMethods>();

  const points = useMemo(
    () =>
      locations.map((loc) => ({
        ...loc,
        size: 0.4 + loc.intensity * 0.7,
        color: EMOTION_COLOR[loc.emotion],
      })),
    [locations],
  );

  const rings = useMemo(() => {
    const baseRings = points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      color: p.color,
      maxR: 3 + p.intensity * 5,
      speed: 1 + p.intensity * 2,
      period: 1200 - p.intensity * 600,
    }));
    const livePings = pings.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      color: p.color,
      maxR: 4,
      speed: 3,
      period: 800,
    }));
    return [...baseRings, ...livePings];
  }, [points, pings]);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = true;
    globeRef.current.pointOfView({ lat: 15, lng: 0, altitude: 2.4 }, 0);
  }, []);

  useEffect(() => {
    if (!selectedId || !globeRef.current) return;
    const loc = locations.find((l) => l.id === selectedId);
    if (!loc) return;
    globeRef.current.pointOfView(
      { lat: loc.lat, lng: loc.lng, altitude: 1.6 },
      1400,
    );
  }, [selectedId, locations]);

  return (
    <Globe
      ref={globeRef}
      width={width}
      height={height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      atmosphereColor="#22ffaa"
      atmosphereAltitude={0.22}
      pointsData={points}
      pointLat="lat"
      pointLng="lng"
      pointColor="color"
      pointAltitude={0.02}
      pointRadius="size"
      pointResolution={6}
      pointsMerge={false}
      onPointClick={(p) => onSelect(p as unknown as EarthLocation)}
      onPointHover={(p) => {
        if (typeof document !== "undefined") {
          document.body.style.cursor = p ? "pointer" : "default";
        }
      }}
      ringsData={rings}
      ringColor={(d: any) => () => d.color}
      ringMaxRadius={(d: any) => d.maxR}
      ringPropagationSpeed={(d: any) => d.speed}
      ringRepeatPeriod={(d: any) => d.period}
      ringAltitude={0.012}
    />
  );
};

export default EarthGlobe;
