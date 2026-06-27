import { type Container, type ISourceOptions } from "@tsparticles/engine";
import Particles from "@tsparticles/react";
import { useCallback, useEffect, useRef } from "react";

export default function AtmosphereLayer() {
  const containerRef = useRef<Container | null>(null);

  const particlesLoaded = useCallback(async (container?: Container) => {
    if (container) containerRef.current = container;
  }, []);

  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    win.__chalkBurst = (x?: number, y?: number) => {
      const c = containerRef.current;
      if (!c) return;
      const cx = x ?? c.canvas.size.width / 2;
      const cy = y ?? c.canvas.size.height / 2;
      for (let i = 0; i < 25; i++) {
        c.addParticle(cx, cy);
      }
    };
    return () => {
      delete win.__chalkBurst;
    };
  }, []);

  const prefersReduced = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current;

  const options: ISourceOptions = {
    fpsLimit: 60,
    particles: {
        number: {
          value: prefersReduced ? 0 : 300,
          density: { enable: true, width: 1920, height: 1080 },
        },
        color: { value: ["#ffffff", "#f0f0e8", "#e8e3d8"] },
        shape: { type: "circle" },
        opacity: {
          value: { min: 0.2, max: 0.35 },
          animation: { enable: true, speed: 0.2, sync: false },
        },
        size: {
          value: { min: 1.2, max: 4 },
          animation: { enable: true, speed: 0.4, sync: false },
        },
        move: {
          enable: true,
          speed: { min: 0.12, max: 0.25 },
          direction: "top",
          random: true,
          straight: false,
          outModes: { default: "bounce" as const },
        },
        wobble: { enable: true, speed: 0.6, distance: 3 },
        shadow: {
        enable: true,
        color: "#e8e3d8",
        blur: 4,
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: !prefersReduced,
          mode: "repulse",
        },
      },
      modes: {
        repulse: {
          distance: 90,
          duration: 1.5,
          speed: 0.2,
        },
      },
    },
    detectRetina: true,
    background: { opacity: 0 },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        backgroundColor: "#0B0D0C",
      }}
    >
      {/* Layer 1: Light beams */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          animation: prefersReduced ? "none" : "beamSway 28s ease-in-out infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "15%",
            width: "40%",
            height: "130%",
            background:
              "linear-gradient(180deg, rgba(232,227,216,0.03) 0%, rgba(232,227,216,0.06) 30%, rgba(232,227,216,0.02) 60%, transparent 100%)",
            filter: "blur(50px)",
            transform: "rotate(12deg)",
            transformOrigin: "top center",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-5%",
            right: "20%",
            width: "30%",
            height: "110%",
            background:
              "linear-gradient(180deg, rgba(232,227,216,0.02) 0%, rgba(232,227,216,0.04) 40%, transparent 80%)",
            filter: "blur(60px)",
            transform: "rotate(-8deg)",
            transformOrigin: "top center",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "45%",
            width: "20%",
            height: "80%",
            background:
              "linear-gradient(180deg, rgba(232,227,216,0.015) 0%, rgba(232,227,216,0.03) 50%, transparent 80%)",
            filter: "blur(40px)",
            transform: "rotate(3deg)",
            transformOrigin: "top center",
          }}
        />
      </div>

      {/* Layer 2: Dust particles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          mixBlendMode: "screen" as const,
          pointerEvents: "none",
        }}
      >
        <Particles
          id="chalk-dust"
          options={options}
          particlesLoaded={particlesLoaded}
          style={{ pointerEvents: "none" }}
        />
      </div>

      {/* Layer 3: Parallax silhouette */}
      <SilhouetteLayer prefersReduced={prefersReduced} />

      <style>{`
        @keyframes beamSway {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          33% { transform: translateX(8px) rotate(0.5deg); }
          66% { transform: translateX(-6px) rotate(-0.3deg); }
        }
      `}</style>
    </div>
  );
}

function SilhouetteLayer({ prefersReduced }: { prefersReduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReduced) return;
    let raf = 0;
    const mx = { x: 0.5, y: 0.5 };
    const handler = (e: MouseEvent) => {
      mx.x = e.clientX / window.innerWidth;
      mx.y = e.clientY / window.innerHeight;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          if (ref.current) {
            const px = (mx.x - 0.5) * 6;
            const py = (mx.y - 0.5) * 4;
            ref.current.style.setProperty("--px", `${px}px`);
            ref.current.style.setProperty("--py", `${py}px`);
          }
          raf = 0;
        });
      }
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [prefersReduced]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        opacity: 0.06,
        transform: prefersReduced
          ? "none"
          : "translate(var(--px, 0px), var(--py, 0px))",
        transition: "transform 80ms linear",
      }}
    >
      <svg
        viewBox="0 0 1440 900"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        <g opacity="0.5" fill="none" stroke="#E8E3D8" strokeWidth="0.5">
          <rect x="200" y="300" width="60" height="180" rx="4" opacity="0.3" />
          <rect x="220" y="280" width="20" height="220" rx="2" opacity="0.2" />
          <rect x="260" y="320" width="50" height="160" rx="4" opacity="0.25" />
          <rect x="180" y="340" width="8" height="120" rx="1" opacity="0.15" />
          <rect x="290" y="310" width="40" height="170" rx="3" opacity="0.2" />

          <rect x="1050" y="350" width="80" height="200" rx="6" opacity="0.25" />
          <rect x="1070" y="330" width="30" height="240" rx="3" opacity="0.15" />
          <rect x="1140" y="370" width="60" height="160" rx="4" opacity="0.2" />
          <rect x="1020" y="390" width="10" height="140" rx="1" opacity="0.12" />

          <circle cx="380" cy="550" r="120" opacity="0.15" />
          <circle cx="380" cy="550" r="100" opacity="0.12" />
          <circle cx="380" cy="550" r="80" opacity="0.1" />
          <line x1="260" y1="550" x2="500" y2="550" opacity="0.08" />

          <circle cx="1120" cy="520" r="90" opacity="0.12" />
          <circle cx="1120" cy="520" r="70" opacity="0.1" />

          <line x1="100" y1="500" x2="200" y2="500" opacity="0.08" />
          <line x1="100" y1="505" x2="180" y2="505" opacity="0.06" />

          <line x1="1240" y1="480" x2="1340" y2="480" opacity="0.08" />
          <line x1="1260" y1="485" x2="1320" y2="485" opacity="0.06" />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
          opacity: 0.15,
        }}
      />
    </div>
  );
}

declare global {
  interface Window {
    __chalkBurst?: (x?: number, y?: number) => void;
  }
}
