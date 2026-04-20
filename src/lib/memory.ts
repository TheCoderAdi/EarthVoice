export interface MemoryEntry {
  id: string;
  locationId: string;
  visitor: string;
  snippet: string;
  timestamp: number;
}

const STORAGE_KEY = "earthvoice_memory_v1";
const MAX_PER_LOCATION = 12;

const SAMPLE_VISITORS = [
  "Aditya",
  "Mira",
  "Kenji",
  "Léa",
  "Noah",
  "Zara",
  "Ravi",
  "Ana",
  "Yuki",
  "Omar",
];
const SAMPLE_TOPICS: Record<string, string[]> = {
  default: [
    "asked about climate change",
    "wondered how you feel",
    "listened in silence",
    "asked what you remember",
    "asked about the future",
  ],
  amazon: [
    "asked about deforestation",
    "asked about the Yanomami people",
    "wondered about your fires",
  ],
  arctic: [
    "asked about the polar bears",
    "asked when the ice melts",
    "wondered about the silence",
  ],
  pacific: [
    "asked about plastic",
    "asked about the whales",
    "wondered about the deep",
  ],
  "great-barrier": [
    "asked about coral bleaching",
    "asked if you're dying",
    "wondered about the colors",
  ],
};

const loadAll = (): MemoryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedMemories();
    const parsed = JSON.parse(raw) as MemoryEntry[];
    return Array.isArray(parsed) ? parsed : seedMemories();
  } catch {
    return seedMemories();
  }
};

const saveAll = (entries: MemoryEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
};

const seedMemories = (): MemoryEntry[] => {
  const now = Date.now();
  const seed: MemoryEntry[] = [];
  const locs = [
    "amazon",
    "arctic",
    "pacific",
    "great-barrier",
    "tokyo",
    "himalayas",
  ];
  locs.forEach((loc, i) => {
    const topics = SAMPLE_TOPICS[loc] ?? SAMPLE_TOPICS.default;
    for (let j = 0; j < 3; j++) {
      seed.push({
        id: `seed-${loc}-${j}`,
        locationId: loc,
        visitor: SAMPLE_VISITORS[(i + j) % SAMPLE_VISITORS.length],
        snippet: topics[j % topics.length],
        timestamp: now - (j + 1) * (1000 * 60 * 60 * (i + 1)),
      });
    }
  });
  saveAll(seed);
  return seed;
};

export const getMemoryFor = (locationId: string): MemoryEntry[] => {
  return loadAll()
    .filter((e) => e.locationId === locationId)
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const addMemory = (
  locationId: string,
  snippet: string,
  visitor = "You",
) => {
  const all = loadAll();
  const entry: MemoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    locationId,
    visitor,
    snippet: snippet.length > 80 ? snippet.slice(0, 77) + "..." : snippet,
    timestamp: Date.now(),
  };
  const next = [entry, ...all].slice(0, 500);
  // cap per-location
  const counts: Record<string, number> = {};
  const filtered = next.filter((e) => {
    counts[e.locationId] = (counts[e.locationId] ?? 0) + 1;
    return counts[e.locationId] <= MAX_PER_LOCATION;
  });
  saveAll(filtered);
  return entry;
};

export const formatRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};
