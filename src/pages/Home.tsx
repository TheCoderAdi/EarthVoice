import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import EarthGlobe from "@/components/EarthGlobe";
import VoicePanel from "@/components/VoicePanel";
import HUDOverlay from "@/components/HUDOverlay";
import StarField from "@/components/StarField";
import VisitorCursors from "@/components/VisitorCursors";
import DemoTour from "@/components/DemoTour";
import { type EarthLocation } from "@/data/locations";
import { fetchLocations, isUsingCustomBackend, apiBase } from "@/lib/api";
import { usePresence } from "@/lib/presence";
import { EMOTION_COLOR } from "@/data/locations";

const Home = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<EarthLocation | null>(null);
  const [locations, setLocations] = useState<EarthLocation[]>([]);

  const selfHotspot = selected
    ? {
        lat: selected.lat,
        lng: selected.lng,
        color: EMOTION_COLOR[selected.emotion],
      }
    : null;
  const { count, pings, cursors } = usePresence(selfHotspot);

  useEffect(() => {
    fetchLocations().then(setLocations);
    console.info(
      `[EarthVoice] API base: ${apiBase()} ${isUsingCustomBackend() ? "(custom)" : "(fallback)"}`,
    );
  }, []);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <StarField />

      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000"
        style={{
          background: selected
            ? `radial-gradient(ellipse at 30% 50%, hsl(var(--emotion-${selected.emotion}) / 0.18), transparent 60%)`
            : "transparent",
        }}
      />

      <HUDOverlay
        liveCount={count}
        pingCount={pings.length}
        locations={locations}
        onSelectLocation={setSelected}
        selectedEmotion={selected?.emotion ?? null}
      />

      <div
        ref={containerRef}
        data-tour="globe"
        className="relative z-[1] h-full w-full"
      >
        {size.w > 0 && locations.length > 0 && (
          <EarthGlobe
            locations={locations}
            pings={pings}
            width={size.w}
            height={size.h}
            onSelect={setSelected}
            selectedId={selected?.id ?? null}
          />
        )}
      </div>

      <VisitorCursors cursors={cursors} />

      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center p-4 md:p-6">
        <AnimatePresence mode="wait">
          {selected && (
            <div
              key={selected.id}
              className="pointer-events-auto h-[min(720px,calc(100vh-3rem))] w-[min(420px,calc(100vw-2rem))]"
            >
              <VoicePanel
                location={selected}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {!selected && <DemoTour />}
    </main>
  );
};

export default Home;
