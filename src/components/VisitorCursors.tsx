import { motion, AnimatePresence } from "motion/react";
import { MousePointer2 } from "lucide-react";
import { type VisitorCursor } from "@/lib/presence";

interface VisitorCursorsProps {
  cursors: VisitorCursor[];
}

const VisitorCursors = ({ cursors }: VisitorCursorsProps) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      <AnimatePresence>
        {cursors.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              scale: 1,
              left: `${c.x * 100}%`,
              top: `${c.y * 100}%`,
            }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 28,
              mass: 0.4,
            }}
            className="absolute -translate-x-1 -translate-y-1"
            style={{ color: c.color }}
          >
            <MousePointer2
              className="h-4 w-4 drop-shadow-[0_0_6px_currentColor]"
              fill="currentColor"
              strokeWidth={1.2}
            />
            <span
              className="ml-3 mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium glass-panel"
              style={{ color: c.color }}
            >
              visitor
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default VisitorCursors;
