interface SoundWaveProps {
  active: boolean;
}

const SoundWave = ({ active }: SoundWaveProps) => {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-0.5 bg-primary rounded-full origin-bottom"
          style={{
            height: "100%",
            animation: active
              ? `soundwave 0.8s ease-in-out ${i * 0.1}s infinite`
              : "none",
            opacity: active ? 1 : 0.3,
            transform: active ? undefined : "scaleY(0.3)",
          }}
        />
      ))}
    </div>
  );
};

export default SoundWave;
