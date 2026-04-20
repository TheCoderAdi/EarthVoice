import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  type EarthLocation,
  EMOTION_COLOR,
  EMOTION_LABEL,
} from "@/data/locations";

interface LocationSearchProps {
  locations: EarthLocation[];
  onSelect: (loc: EarthLocation) => void;
}

const LocationSearch = ({ locations, onSelect }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations.slice(0, 8);
    return locations
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.shortName.toLowerCase().includes(q) ||
          l.tagline.toLowerCase().includes(q) ||
          l.emotion.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [locations, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handlePick = (loc: EarthLocation) => {
    onSelect(loc);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIdx];
      if (pick) handlePick(pick);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative pointer-events-auto"
      data-tour="search"
    >
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="glass-panel rounded-full px-3 py-1.5 flex items-center gap-2 text-xs hover:bg-primary/10 transition-colors"
        >
          <Search className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Search Earth…</span>
          <kbd className="ml-1 hidden sm:inline-flex items-center rounded border border-border/50 bg-background/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      ) : (
        <div className="glass-panel rounded-2xl w-[min(360px,calc(100vw-3rem))] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
            <Search className="h-4 w-4 text-primary shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Find a place on Earth…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
            <button
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin py-1">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                No place echoes that name.
              </div>
            ) : (
              results.map((loc, idx) => (
                <button
                  key={loc.id}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => handlePick(loc)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${
                    idx === activeIdx ? "bg-primary/10" : "hover:bg-primary/5"
                  }`}
                >
                  <span
                    className="relative flex h-2.5 w-2.5 shrink-0"
                    style={{
                      filter: `drop-shadow(0 0 6px ${EMOTION_COLOR[loc.emotion]})`,
                    }}
                  >
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                      style={{ backgroundColor: EMOTION_COLOR[loc.emotion] }}
                    />
                    <span
                      className="relative inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: EMOTION_COLOR[loc.emotion] }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {loc.shortName}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {loc.tagline}
                    </div>
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: EMOTION_COLOR[loc.emotion],
                      borderColor: `${EMOTION_COLOR[loc.emotion]}55`,
                    }}
                  >
                    {EMOTION_LABEL[loc.emotion]}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
