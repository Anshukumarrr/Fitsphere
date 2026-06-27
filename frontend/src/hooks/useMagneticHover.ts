import { useSpring, useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";

export function useMagneticHover(radius = 8) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { damping: 18, stiffness: 240, mass: 0.3 });
  const y = useSpring(rawY, { damping: 18, stiffness: 240, mass: 0.3 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.min(rect.width, rect.height) / 2;
      const factor = Math.min(1, dist / maxDist);
      const clamp = radius * (1 - factor * 0.5);
      const angle = Math.atan2(dy, dx);
      rawX.set(Math.cos(angle) * clamp);
      rawY.set(Math.sin(angle) * clamp);
    };

    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [radius, rawX, rawY]);

  return { ref, x, y };
}
