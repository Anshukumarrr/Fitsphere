import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import Box from "@mui/material/Box";

const DIGIT_HEIGHT = 28;
const STAGGER_MS = 80;
const DURATION_S = 0.45;

function easeOutBack(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.2;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

interface ReelDigitProps {
  target: number;
  delay: number;
  play: boolean;
}

function ReelDigit({ target, delay, play }: ReelDigitProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!play) return;
    const timer = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      animate(
        el,
        { y: -target * DIGIT_HEIGHT },
        {
          duration: DURATION_S,
          ease: easeOutBack,
        }
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [play, target, delay]);

  return (
    <Box
      sx={{
        width: "0.55em",
        height: DIGIT_HEIGHT,
        overflow: "hidden",
        display: "inline-block",
        position: "relative",
        lineHeight: 1,
      }}
    >
      <Box
        ref={ref}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          willChange: "transform",
          y: 0,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Box
            key={n}
            component="span"
            sx={{
              height: DIGIT_HEIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {n}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

interface MechanicalCounterProps {
  value: number;
  triggerOnView?: boolean;
  sx?: Record<string, unknown>;
}

export default function MechanicalCounter({
  value,
  triggerOnView = true,
  sx,
}: MechanicalCounterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true });
  const [play, setPlay] = useState(false);
  const playRef = useRef(play);
  playRef.current = play;

  const prefersReduced = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current;

  useEffect(() => {
    if (triggerOnView && inView && !playRef.current) {
      setPlay(true);
    }
  }, [inView, triggerOnView]);

  useEffect(() => {
    if (!triggerOnView) {
      setPlay(true);
    }
  }, [triggerOnView, value]);

  if (prefersReduced) {
    return (
      <Box
        component="span"
        sx={{ fontVariantNumeric: "tabular-nums", fontFamily: '"JetBrains Mono", monospace', ...sx }}
      >
        {value}
      </Box>
    );
  }

  const digits = Math.abs(value).toString().split("").map(Number);
  const isNegative = value < 0;

  return (
    <Box
      ref={containerRef}
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: '"JetBrains Mono", monospace',
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
        ...sx,
      }}
    >
      {isNegative && <Box component="span" sx={{ mr: "0.05em" }}>-</Box>}
      {digits.map((d, i) => (
        <ReelDigit key={`${value}-${i}`} target={d} delay={i * STAGGER_MS} play={play} />
      ))}
    </Box>
  );
}
