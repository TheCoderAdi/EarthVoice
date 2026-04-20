import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { type Emotion } from "@/data/locations";
import { getAmbientBed } from "@/lib/ambient";

interface AmbientControlProps {
  emotion: Emotion | null;
}

const STORAGE_KEY = "earthvoice.ambient.muted";

const AmbientControl = ({ emotion }: AmbientControlProps) => {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    const bed = getAmbientBed();
    bed.setMuted(muted);
    bed.setEmotion(emotion);
  }, [emotion, muted]);

  const toggle = () => {
    setMuted((m) => {
      const next = !m;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={muted ? "Unmute ambient" : "Mute ambient"}
      aria-label={muted ? "Unmute ambient" : "Mute ambient"}
      className="glass-panel pointer-events-auto flex h-9 items-center gap-2 rounded-full px-3 text-xs uppercase tracking-widest text-muted-foreground transition hover:text-primary"
    >
      {muted ? (
        <VolumeX className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5 text-primary" />
      )}
      <span className="hidden sm:inline">
        {emotion ? (muted ? "Muted" : "Ambient") : "Silent"}
      </span>
    </button>
  );
};

export default AmbientControl;
