import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  type EarthLocation,
  EMOTION_COLOR,
  EMOTION_LABEL,
} from "@/data/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchNarrative, sendChat, fetchMemory, recordMemory } from "@/lib/api";
import { type MemoryEntry } from "@/lib/memory";
import { toast } from "sonner";
import TypingText from "./TypingText";
import MemoryTimeline from "./MemoryTimeline";
import SoundWave from "./SoundWave";

interface VoicePanelProps {
  location: EarthLocation;
  onClose: () => void;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

const VoicePanel = ({ location, onClose }: VoicePanelProps) => {
  const [narrative, setNarrative] = useState<string>("");
  const [loadingNarrative, setLoadingNarrative] = useState(true);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [narrativeOpen, setNarrativeOpen] = useState(true);
  const [narrativeDone, setNarrativeDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Hard-stop any speech synthesis currently playing.
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utterRef.current = null;
    setSpeaking(false);
    setSpeakingId(null);
  };

  const emotionColor = EMOTION_COLOR[location.emotion];

  // Suggested questions to help users know what to ask
  const SUGGESTED_QUESTIONS = [
    "How are you feeling right now?",
    "What do you remember from long ago?",
    "What is hurting you the most?",
    "What would you ask of humans?",
    "What gives you hope?",
  ];

  useEffect(() => {
    setNarrative("");
    setChat([]);
    setLoadingNarrative(true);
    setNarrativeOpen(true);
    setNarrativeDone(false);
    setMemoryOpen(false);

    let cancelled = false;
    (async () => {
      try {
        const [mems, n] = await Promise.all([
          fetchMemory(location.id),
          fetchNarrative(location),
        ]);
        if (cancelled) return;
        setMemories(mems);
        setNarrative(n);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to reach Earth";
        toast.error(msg);
        setNarrative(
          "I am here... but my voice is faint right now. Try again in a moment.",
        );
      } finally {
        if (!cancelled) setLoadingNarrative(false);
      }
    })();

    return () => {
      cancelled = true;
      // Stop any in-flight speech when switching locations
      stopSpeaking();
    };
  }, [location.id, location.name, location.emotion]);

  // Stop speech when the panel unmounts (e.g. user closes it)
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userTurn: ChatTurn = { role: "user", content: text };
    setChat((c) => [...c, userTurn]);
    void recordMemory(location.id, `asked: "${text}"`);
    setSending(true);
    // Auto-collapse narrative once a real conversation begins
    setNarrativeOpen(false);

    try {
      const history = chat.map((t) => ({ role: t.role, content: t.content }));
      const reply = await sendChat(location, text, history);
      setChat((c) => [
        ...c,
        { role: "assistant", content: reply, isTyping: true },
      ]);
      setSpeaking(true);
      setTimeout(
        () => setSpeaking(false),
        Math.min(reply.length * 16 + 600, 8000),
      );
      // refresh memory list (in case backend added one)
      fetchMemory(location.id)
        .then(setMemories)
        .catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to reach Earth";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleSpeak = (text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast("Voice not supported in this browser");
      return;
    }
    // Toggle off if the same source is already speaking
    if (speakingId === id) {
      stopSpeaking();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 0.85;
    utter.onstart = () => {
      setSpeaking(true);
      setSpeakingId(id);
    };
    utter.onend = () => {
      setSpeaking(false);
      setSpeakingId(null);
      utterRef.current = null;
    };
    utter.onerror = () => {
      setSpeaking(false);
      setSpeakingId(null);
      utterRef.current = null;
    };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: "spring", damping: 22, stiffness: 220 }}
      className="glass-panel relative z-20 flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl"
      style={{
        boxShadow: `0 0 60px ${emotionColor}33, 0 20px 60px -10px rgba(0,0,0,0.8)`,
        border: `1px solid ${emotionColor}55`,
      }}
    >
      {/* Aura */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${emotionColor}88, transparent 60%)`,
        }}
      />

      {/* Header — fixed */}
      <div className="relative shrink-0 flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-2 w-2 rounded-full animate-pulse-glow"
              style={{
                background: emotionColor,
                boxShadow: `0 0 12px ${emotionColor}`,
              }}
            />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Earth voice
            </span>
          </div>
          <h2 className="text-2xl font-bold neon-text leading-tight">
            {location.name}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full"
              style={{
                background: `${emotionColor}22`,
                color: emotionColor,
                border: `1px solid ${emotionColor}55`,
              }}
            >
              {EMOTION_LABEL[location.emotion]}
            </span>
            <SoundWave active={speaking} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 hover:bg-primary/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* SCROLLABLE middle area: narrative (collapsible) + memory (collapsible) + chat */}
      <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin px-5 pb-3 space-y-3">
        {/* Narrative — collapsible */}
        <section>
          <button
            onClick={() => setNarrativeOpen((o) => !o)}
            className="w-full flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground/80 mb-2 hover:text-primary transition"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />I am speaking…
            </span>
            {narrativeOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {narrativeOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="relative rounded-xl border border-primary/20 bg-background/40 p-4 text-sm leading-relaxed">
                  {loadingNarrative ? (
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
                      <div className="h-3 w-5/6 rounded bg-primary/10 animate-pulse" />
                      <div className="h-3 w-4/6 rounded bg-primary/10 animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <TypingText
                        text={narrative}
                        speed={12}
                        onDone={() => setNarrativeDone(true)}
                      />
                      <button
                        onClick={() => handleSpeak(narrative, "narrative")}
                        className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-primary/10 transition"
                        title={
                          speakingId === "narrative"
                            ? "Stop speaking"
                            : "Hear my voice"
                        }
                      >
                        {speakingId === "narrative" ? (
                          <VolumeX className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Memory — collapsible */}
        <section>
          <button
            onClick={() => setMemoryOpen((o) => !o)}
            className="w-full flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground/80 mb-2 hover:text-primary transition"
          >
            <span>What I remember ({memories.length})</span>
            {memoryOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {memoryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <MemoryTimeline entries={memories} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Chat */}
        <section>
          <div className="text-xs uppercase tracking-widest text-muted-foreground/80 mb-2">
            Conversation
          </div>
          <div ref={scrollRef} className="space-y-2">
            {chat.length === 0 && !sending && (
              <div className="space-y-2 px-1">
                <div className="text-xs text-muted-foreground/60 italic">
                  {narrativeDone
                    ? "Ask me anything. Try one of these, or write your own:"
                    : "Let me finish speaking, then ask me anything…"}
                </div>
                {narrativeDone && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setInput(q);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-foreground/80 hover:bg-primary/15 hover:text-foreground transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <AnimatePresence initial={false}>
              {chat.map((turn, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm rounded-xl px-3 py-2 max-w-[90%] ${
                    turn.role === "user"
                      ? "ml-auto bg-primary/15 border border-primary/30 text-foreground"
                      : "mr-auto bg-background/50 border border-border/60"
                  }`}
                >
                  {turn.role === "assistant" ? (
                    <div className="flex items-start gap-2">
                      <div className="flex-1 leading-relaxed">
                        {turn.isTyping ? (
                          <TypingText
                            text={turn.content}
                            speed={14}
                            onDone={() =>
                              setChat((c) =>
                                c.map((t, idx) =>
                                  idx === i ? { ...t, isTyping: false } : t,
                                ),
                              )
                            }
                          />
                        ) : (
                          turn.content
                        )}
                      </div>
                      <button
                        onClick={() => handleSpeak(turn.content, `chat-${i}`)}
                        className="p-1 rounded-md hover:bg-primary/10 shrink-0"
                        title={
                          speakingId === `chat-${i}`
                            ? "Stop speaking"
                            : "Hear reply"
                        }
                      >
                        {speakingId === `chat-${i}` ? (
                          <VolumeX className="h-3 w-3 text-primary" />
                        ) : (
                          <Volume2 className="h-3 w-3 text-primary" />
                        )}
                      </button>
                    </div>
                  ) : (
                    turn.content
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {sending && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 px-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Earth is gathering its thoughts…
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Input — fixed bottom */}
      <div className="relative shrink-0 p-4 pt-3 border-t border-primary/15 bg-background/60 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              narrativeDone ? "Talk to Earth…" : "Earth is still speaking…"
            }
            disabled={sending || !narrativeDone}
            className="bg-background/60 border-primary/30 focus-visible:ring-primary/60 placeholder:text-muted-foreground/60 disabled:opacity-60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim() || !narrativeDone}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </motion.aside>
  );
};

export default VoicePanel;
