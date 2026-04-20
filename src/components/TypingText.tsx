import { useEffect, useRef, useState } from "react";

interface TypingTextProps {
  text: string;
  speed?: number;
  onDone?: () => void;
  className?: string;
  instant?: boolean;
}

const TypingText = ({
  text,
  speed = 14,
  onDone,
  className,
  instant = false,
}: TypingTextProps) => {
  const [shown, setShown] = useState(instant ? text : "");
  const [skipped, setSkipped] = useState(instant);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (instant) {
      setShown(text);
      setSkipped(true);
      onDoneRef.current?.();
      return;
    }
    setShown("");
    setSkipped(false);
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        onDoneRef.current?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, instant]);

  const handleSkip = () => {
    if (skipped || shown.length >= text.length) return;
    setShown(text);
    setSkipped(true);
    onDoneRef.current?.();
  };

  const done = shown.length >= text.length;

  return (
    <span
      onClick={handleSkip}
      title={done ? undefined : "Click to skip"}
      className={`${className ?? ""} ${done ? "" : "typing-cursor cursor-pointer"} whitespace-pre-wrap`}
    >
      {shown}
    </span>
  );
};

export default TypingText;
