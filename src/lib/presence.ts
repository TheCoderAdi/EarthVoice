import { useEffect, useRef, useState } from "react";
import { LOCATIONS } from "@/data/locations";

export interface ActivityPing {
  id: string;
  lat: number;
  lng: number;
  color: string;
  ts: number;
}

export interface VisitorCursor {
  id: string;
  x: number;
  y: number;
  color: string;
  ts: number;
}

const WS_URL = import.meta.env.VITE_EARTHVOICE_WS_URL as string | undefined;

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const COLORS = [
  "#22ffaa",
  "#7dd3fc",
  "#f9a8a8",
  "#fde68a",
  "#c4b5fd",
  "#fca5a5",
];
const myColor = COLORS[Math.floor(Math.random() * COLORS.length)];

export const usePresence = (
  selfHotspot?: { lat: number; lng: number; color: string } | null,
) => {
  const [count, setCount] = useState(1);
  const [pings, setPings] = useState<ActivityPing[]>([]);
  const [cursors, setCursors] = useState<Record<string, VisitorCursor>>({});
  const userIdRef = useRef<string>(randomId());
  const wsRef = useRef<WebSocket | null>(null);
  const lastCursorSentRef = useRef<number>(0);

  const addPing = (p: ActivityPing) => {
    setPings((prev) => [...prev, p].slice(-30));
    setTimeout(() => {
      setPings((prev) => prev.filter((x) => x.id !== p.id));
    }, 6000);
  };

  useEffect(() => {
    const userId = userIdRef.current;
    let ws: WebSocket | null = null;

    const send = (msg: unknown) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(msg));
        } catch {
          /* ignore */
        }
      }
    };

    if (WS_URL) {
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.addEventListener("open", () => {
          send({ type: "hello", id: userId, color: myColor });
        });
        ws.addEventListener("message", (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === "count" && typeof msg.count === "number") {
              setCount(Math.max(1, msg.count));
            } else if (msg.type === "ping") {
              addPing(msg as ActivityPing);
            } else if (msg.type === "cursor" && msg.id !== userId) {
              const c = msg as VisitorCursor;
              setCursors((prev) => ({ ...prev, [c.id]: c }));
            } else if (msg.type === "leave" && msg.id) {
              setCursors((prev) => {
                const next = { ...prev };
                delete next[msg.id];
                return next;
              });
            }
          } catch {
            /* ignore */
          }
        });
        ws.addEventListener("error", () => {
          console.warn("[earthvoice] presence WS error");
        });
      } catch (e) {
        console.warn("[earthvoice] presence WS failed to connect", e);
      }
    }

    const interval = setInterval(() => {
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const ping: ActivityPing = {
        id: randomId(),
        lat: loc.lat + (Math.random() - 0.5) * 4,
        lng: loc.lng + (Math.random() - 0.5) * 4,
        color: "#22ffaa",
        ts: Date.now(),
      };
      addPing(ping);
      send({ type: "ping", ...ping });
    }, 4000);

    const cursorExpire = setInterval(() => {
      const cutoff = Date.now() - 8000;
      setCursors((prev) => {
        const next: Record<string, VisitorCursor> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v.ts >= cutoff) next[k] = v;
        }
        return next;
      });
    }, 2000);

    // Broadcast cursor position.
    const onMove = (e: PointerEvent) => {
      const now = Date.now();
      if (now - lastCursorSentRef.current < 60) return;
      lastCursorSentRef.current = now;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      send({ type: "cursor", id: userId, x, y, color: myColor, ts: now });
    };
    window.addEventListener("pointermove", onMove);

    const onLeave = () => send({ type: "leave", id: userId });
    window.addEventListener("beforeunload", onLeave);

    return () => {
      clearInterval(interval);
      clearInterval(cursorExpire);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("beforeunload", onLeave);
      onLeave();
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selfHotspot) return;
    const ping: ActivityPing = {
      id: randomId(),
      lat: selfHotspot.lat,
      lng: selfHotspot.lng,
      color: selfHotspot.color,
      ts: Date.now(),
    };
    addPing(ping);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "ping", ...ping }));
      } catch {
        /* ignore */
      }
    }
  }, [selfHotspot?.lat, selfHotspot?.lng, selfHotspot?.color]);

  return { count, pings, cursors: Object.values(cursors) };
};
