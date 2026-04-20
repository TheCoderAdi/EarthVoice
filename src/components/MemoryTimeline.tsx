import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { formatRelativeTime, type MemoryEntry } from "@/lib/memory";

interface MemoryTimelineProps {
  entries: MemoryEntry[];
}

const MemoryTimeline = ({ entries }: MemoryTimelineProps) => {
  if (entries.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic px-1">
        No memories yet — be the first voice I remember.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin pr-1">
      {entries.slice(0, 6).map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-2 text-xs"
        >
          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          <div className="flex-1 leading-relaxed">
            <span className="text-primary font-medium">{m.visitor}</span>{" "}
            <span className="text-muted-foreground">{m.snippet}</span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatRelativeTime(m.timestamp)}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MemoryTimeline;
