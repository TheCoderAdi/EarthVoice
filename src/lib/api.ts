import {
  type Emotion,
  type EarthLocation,
  LOCATIONS as FALLBACK_LOCATIONS,
} from "@/data/locations";
import {
  addMemory as addLocalMemory,
  getMemoryFor as getLocalMemory,
  type MemoryEntry,
} from "@/lib/memory";

const BASE =
  (import.meta.env.VITE_EARTHVOICE_API_BASE as string | undefined)?.replace(
    /\/$/,
    "",
  ) || "";

if (!BASE && typeof window !== "undefined") {
  console.warn(
    "[EarthVoice] VITE_EARTHVOICE_API_BASE is not set. The app will use bundled location data and local memory only — narrative & chat will fail until you point it at your backend.",
  );
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const safeFetch = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Request failed (${res.status}): ${text || res.statusText}`,
    );
  }
  return res.json();
};

// Locations
export const fetchLocations = async (): Promise<EarthLocation[]> => {
  if (!BASE) return FALLBACK_LOCATIONS;
  try {
    const data = await safeFetch(`${BASE}/api/locations`);
    const list = (data?.locations ?? data) as EarthLocation[];
    if (!Array.isArray(list) || list.length === 0) return FALLBACK_LOCATIONS;
    return list.map((l) => ({
      ...l,
      emotion: (l.emotion ?? "calm") as Emotion,
      intensity: Math.max(0, Math.min(1, l.intensity ?? 0.5)),
    }));
  } catch (e) {
    console.warn(
      "[earthvoice] fetchLocations failed, using bundled fallback",
      e,
    );
    return FALLBACK_LOCATIONS;
  }
};

// Narrative
export const fetchNarrative = async (
  location: EarthLocation,
): Promise<string> => {
  if (!BASE)
    throw new Error(
      "Backend not configured. Set VITE_EARTHVOICE_API_BASE in .env",
    );
  const data = await safeFetch(`${BASE}/api/narrative`, {
    method: "POST",
    body: JSON.stringify({ locationId: location.id }),
  });
  return data?.reply ?? "...";
};

// Chat
export const sendChat = async (
  location: EarthLocation,
  message: string,
  history: ChatMessage[],
): Promise<string> => {
  if (!BASE)
    throw new Error(
      "Backend not configured. Set VITE_EARTHVOICE_API_BASE in .env",
    );
  const data = await safeFetch(`${BASE}/api/chat`, {
    method: "POST",
    body: JSON.stringify({ locationId: location.id, message, history }),
  });
  return data?.reply ?? "...";
};

// Memory
export const fetchMemory = async (
  locationId: string,
): Promise<MemoryEntry[]> => {
  if (!BASE) return getLocalMemory(locationId);
  try {
    const data = await safeFetch(
      `${BASE}/api/memory/${encodeURIComponent(locationId)}`,
    );
    const list = (data?.memories ?? data) as MemoryEntry[];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("[earthvoice] fetchMemory failed, using local", e);
    return getLocalMemory(locationId);
  }
};

export const recordMemory = async (
  locationId: string,
  snippet: string,
  visitor = "You",
): Promise<void> => {
  if (BASE) {
    try {
      await safeFetch(`${BASE}/api/memory`, {
        method: "POST",
        body: JSON.stringify({ locationId, visitor, snippet }),
      });
      return;
    } catch (e) {
      console.warn(
        "[earthvoice] recordMemory failed, falling back to local",
        e,
      );
    }
  }
  addLocalMemory(locationId, snippet, visitor);
};

export const isUsingCustomBackend = () => BASE.length > 0;
export const apiBase = () => BASE || "(none — set VITE_EARTHVOICE_API_BASE)";
