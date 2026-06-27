import { useCallback, useRef, type ReactNode } from "react";

interface SpecularHoverProps {
  children: ReactNode;
  className?: string;
  sx?: Record<string, unknown>;
}

export default function SpecularHover({ children, className, sx }: SpecularHoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current ?? (e.currentTarget as HTMLElement);
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
  }, []);

  const onLeave = useCallback((e: React.MouseEvent) => {
    const el = ref.current ?? (e.currentTarget as HTMLElement);
    el.style.setProperty("--mx", `50%`);
    el.style.setProperty("--my", `50%`);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        position: "relative",
        overflow: "hidden",
        ...sx,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle 60px at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.06) 0%, transparent 60%)",
          transition: "background 0.1s ease-out",
          borderRadius: "inherit",
        }}
      />
    </div>
  );
}
