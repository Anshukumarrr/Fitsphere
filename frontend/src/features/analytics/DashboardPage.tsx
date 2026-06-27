import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import { useDashboard } from "../../hooks/useApi";
import PlateGauge from "../../components/PlateGauge";
import MechanicalCounter from "../../components/MechanicalCounter";
import SpecularHover from "../../components/SpecularHover";

function StatCard({
  label,
  value,
  accent = false,
  prefix = "",
}: {
  label: string;
  value: number | string | null | undefined;
  accent?: boolean;
  prefix?: string;
}) {
  const isEmpty = value == null || value === 0 || value === "—" || value === "₹0";

  return (
    <SpecularHover>
      <Card
        sx={{
          height: "100%",
          overflow: "visible",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "10%",
            width: "80%",
            height: 2,
            borderRadius: "0 0 2px 2px",
            backgroundColor: accent ? "#D4FF3F" : "rgba(212,255,63,0.3)",
            opacity: 0.6,
            transition: "opacity 120ms ease-out, height 120ms ease-out",
            zIndex: 1,
          },
          "&:hover::before": {
            opacity: 1,
            height: 3,
          },
          "&:hover": {
            borderColor: "rgba(212,255,63,0.2)",
          },
        }}
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
          <Box
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "2.2rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              color: accent ? "#D4FF3F" : "#E8E3D8",
              mb: 1,
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: "0.05em",
            }}
          >
            {isEmpty ? (
              <Box sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif', fontSize: "1.8rem", fontWeight: 300 }}>
                —
              </Box>
            ) : typeof value === "number" ? (
              <>
                {prefix && <span>{prefix}</span>}
                <MechanicalCounter value={value} triggerOnView={false} />
              </>
            ) : (
              value
            )}
          </Box>
          <Box
            sx={{
              fontFamily: '"Anton", sans-serif',
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: isEmpty ? "#6B6F6C" : "#6B6F6C",
              textAlign: "center",
            }}
          >
            {label}
          </Box>
          {isEmpty && (
            <Box
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: "0.6rem",
                color: "#6B6F6C",
                mt: 0.5,
                fontStyle: "italic",
              }}
            >
              No activity yet
            </Box>
          )}
        </CardContent>
      </Card>
    </SpecularHover>
  );
}

import MemberDashboardPage from "../member/MemberDashboardPage";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "member") {
    return <MemberDashboardPage />;
  }
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Skeleton variant="rounded" height={160} sx={{ bgcolor: "#1A1D1B", borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const attendanceRate = data?.attendance_today && data?.active_members
    ? Math.min(Math.round((data.attendance_today / data.active_members) * 100), 100)
    : 0;

  const expiringRate = data?.expiring_this_month && data?.active_members
    ? Math.min(Math.round((data.expiring_this_month / data.active_members) * 100), 100)
    : 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SpecularHover>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <PlateGauge
                  value={attendanceRate}
                  label="ATTENDANCE TODAY"
                  subtitle={data?.attendance_today ? `${data.attendance_today} check-ins` : "No check-ins yet"}
                  color={attendanceRate > 0 ? "#D4FF3F" : "#6B6F6C"}
                />
              </CardContent>
            </Card>
          </SpecularHover>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="ACTIVE MEMBERS"
            value={data?.active_members ?? null}
            accent
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="NEW THIS MONTH"
            value={data?.new_members_this_month ?? null}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SpecularHover>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <PlateGauge
                  value={expiringRate}
                  label="EXPIRING THIS MONTH"
                  subtitle={data?.expiring_this_month ? `${data.expiring_this_month} members` : "All clear"}
                  color={expiringRate > 10 ? "#FF4B3E" : expiringRate > 0 ? "#D4FF3F" : "#6B6F6C"}
                />
              </CardContent>
            </Card>
          </SpecularHover>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="REVENUE THIS MONTH"
            value={data?.revenue_this_month ?? null}
            prefix="₹"
            accent
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="REVENUE TODAY"
            value={data?.revenue_today ?? null}
            prefix="₹"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="TOTAL MEMBERS"
            value={data?.active_members ?? "—"}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="COMBINED REVENUE"
            value={data ? Number(data.revenue_this_month) + Number(data.revenue_today) : null}
            prefix="₹"
            accent
          />
        </Grid>
      </Grid>
    </Box>
  );
}
