import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import { useTrainerDashboard } from "../../hooks/useApi";
import SpecularHover from "../../components/SpecularHover";

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | null | undefined;
  accent?: boolean;
}) {
  const isEmpty = value == null || value === 0;

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
          "&:hover::before": { opacity: 1, height: 3 },
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
              color: isEmpty ? "#8A8F8C" : accent ? "#D4FF3F" : "#E8E3D8",
              mb: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {isEmpty ? "—" : value}
          </Box>
          <Box
            sx={{
              fontFamily: '"Anton", sans-serif',
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#8A8F8C",
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
                color: "#8A8F8C",
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

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useTrainerDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Skeleton variant="rounded" height={150} sx={{ bgcolor: "#1A1D1B", borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Welcome back, {user?.first_name}
          </Typography>
          <Typography variant="body2" sx={{ color: "#8A8F8C" }}>
            Your training dashboard
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="SESSIONS TODAY" value={data?.sessions_today ?? null} accent />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="COMPLETED THIS WEEK" value={data?.completed_this_week ?? null} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="BRANCH MEMBERS" value={data?.total_members ?? null} />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Upcoming Sessions
      </Typography>
      {!data?.upcoming_sessions?.length ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#8A8F8C" }}>
            No upcoming sessions — schedule one to get started.
          </Typography>
        </Card>
      ) : (
        <Card>
          {data.upcoming_sessions.map((s, i) => (
            <Box
              key={s.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 3,
                py: 2,
                borderBottom: i < data.upcoming_sessions.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{s.member_name}</Typography>
                <Typography variant="body2" sx={{ color: "#8A8F8C" }}>
                  {new Date(s.scheduled_date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  · {s.scheduled_time.slice(0, 5)} · {s.duration_minutes} min
                </Typography>
              </Box>
              <Button size="small" variant="text" onClick={() => navigate({ to: "/pt-sessions" })}>
                View
              </Button>
            </Box>
          ))}
        </Card>
      )}
    </Box>
  );
}