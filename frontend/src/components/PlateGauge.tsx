interface PlateGaugeProps {
  value: number;
  label: string;
  subtitle?: string;
  color?: string;
  size?: number;
}

export default function PlateGauge({
  value,
  label,
  subtitle,
  color = "#D4FF3F",
  size = 140,
}: PlateGaugeProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const center = size / 2;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#2A2D2B"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#E8E3D8"
          fontFamily='"JetBrains Mono", monospace'
          fontSize="28"
        >
          {value}
        </text>
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#6B6F6C"
          fontFamily='"Inter", sans-serif'
          fontSize="10"
        >
          %
        </text>
      </svg>
      <div
        style={{
          fontFamily: '"Anton", sans-serif',
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#E8E3D8",
          marginTop: 8,
        }}
      >
        {label}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: "0.7rem",
            color: "#6B6F6C",
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function StatValue({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: '"Anton", sans-serif',
          fontSize: "2rem",
          lineHeight: 1,
          color: accent ? "#D4FF3F" : "#E8E3D8",
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#6B6F6C",
        }}
      >
        {label}
      </div>
    </div>
  );
}
