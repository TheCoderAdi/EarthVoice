import { useEffect, useState } from "react";
import { Joyride, STATUS, type Step } from "react-joyride";

const STORAGE_KEY = "earthvoice-tour-seen";

const steps: Step[] = [
  {
    target: "[data-tour='globe']",
    title: "🌍 Meet a living Earth",
    content:
      "This is not a map — it's a sentient planet. Every glowing dot is a place that can speak, feel, and remember.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "[data-tour='hud-live']",
    title: "👥 You're not alone",
    content:
      "This counter shows everyone exploring Earth right now. Move your mouse — others can see your cursor too.",
    placement: "bottom",
  },
  {
    target: "[data-tour='hud-pulses']",
    title: "💓 Live planetary pulse",
    content:
      "Each pulse is a real interaction happening somewhere on the globe — a click, a question, a moment.",
    placement: "bottom",
  },
  {
    target: "[data-tour='globe']",
    title: "🎙️ Click any glowing point",
    content:
      "Try the Amazon, the Arctic, or Tokyo. Earth will introduce itself in first person and remember your conversation.",
    placement: "center",
  },
  {
    target: "[data-tour='hud-hint']",
    title: "✨ That's it — you're ready",
    content: "Listen closely. The planet has things to say.",
    placement: "top",
  },
];

const DemoTour = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setRun(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleCallback = (data) => {
    const { status } = data;
    const finished: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finished.includes(status)) {
      localStorage.setItem(STORAGE_KEY, "1");
      setRun(false);
    }
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRun(true);
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        disableOverlayClose
        callback={handleCallback}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: "hsl(165, 100%, 55%)",
            backgroundColor: "hsl(222, 47%, 8%)",
            textColor: "hsl(210, 40%, 96%)",
            arrowColor: "hsl(222, 47%, 8%)",
            overlayColor: "rgba(2, 6, 18, 0.78)",
          },
          tooltip: {
            borderRadius: 16,
            border: "1px solid hsl(165, 100%, 55%, 0.25)",
            boxShadow: "0 20px 60px -10px hsl(165, 100%, 55%, 0.3)",
          },
          buttonNext: {
            borderRadius: 999,
            padding: "8px 16px",
            fontWeight: 600,
          },
          buttonBack: { color: "hsl(210, 40%, 70%)" },
          buttonSkip: { color: "hsl(210, 40%, 60%)" },
        }}
        locale={{
          last: "Begin",
          skip: "Skip tour",
          next: "Next",
          back: "Back",
        }}
      />
      <button
        onClick={restart}
        className="fixed bottom-6 right-6 z-30 glass-panel rounded-full px-3 py-1.5 text-[11px] tracking-wide text-muted-foreground hover:text-primary transition-colors"
      >
        ✨ Replay tour
      </button>
    </>
  );
};

export default DemoTour;
