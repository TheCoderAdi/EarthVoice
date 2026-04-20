import { useMemo } from "react";

const StarField = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 6,
        dx: (Math.random() - 0.5) * 200,
        dy: (Math.random() - 0.5) * 200,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary/60"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: `0 0 ${p.size * 4}px hsl(var(--primary) / 0.8)`,
            animation: `particle-drift ${p.duration}s ease-in-out ${p.delay}s infinite`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
};

export default StarField;
