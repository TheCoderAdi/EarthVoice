import { Activity, Globe2, Users } from "lucide-react";
import LocationSearch from "@/components/LocationSearch";
import AmbientControl from "@/components/AmbientControl";
import { type EarthLocation, type Emotion } from "@/data/locations";

interface HUDOverlayProps {
  liveCount: number;
  pingCount: number;
  locations: EarthLocation[];
  onSelectLocation: (loc: EarthLocation) => void;
  selectedEmotion: Emotion | null;
}

const HUDOverlay = ({
  liveCount,
  pingCount,
  locations,
  onSelectLocation,
  selectedEmotion,
}: HUDOverlayProps) => {
  return (
    <>
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-10 flex items-start justify-between p-6">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Globe2 className="h-7 w-7 text-primary" />
              <div className="absolute inset-0 blur-md bg-primary/40 rounded-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight neon-text">
                EarthVoice
              </h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Listen to a living planet
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
          <LocationSearch locations={locations} onSelect={onSelectLocation} />
          <AmbientControl emotion={selectedEmotion} />
          <div
            data-tour="hud-live"
            className="glass-panel rounded-full px-3 py-1.5 flex items-center gap-2 text-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emotion-healing opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emotion-healing" />
            </span>
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium tabular-nums">{liveCount}</span>
            <span className="text-muted-foreground">live</span>
          </div>
          <div
            data-tour="hud-pulses"
            className="glass-panel rounded-full px-3 py-1.5 flex items-center gap-2 text-xs"
          >
            <Activity className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground tabular-nums">
              {pingCount} pulses
            </span>
          </div>
        </div>
      </div>

      <div
        data-tour="hud-hint"
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="glass-panel rounded-full px-4 py-2 text-xs text-muted-foreground tracking-wide">
          <span className="text-primary font-medium">Click</span> a glowing
          point to hear what the Earth has to say
        </div>
      </div>
    </>
  );
};

export default HUDOverlay;
