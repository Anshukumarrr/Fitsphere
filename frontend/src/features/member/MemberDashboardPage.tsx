import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import { useMemberDashboard } from "../../hooks/useApi";
import PlateGauge from "../../components/PlateGauge";
import MemberCheckInPanel from "../attendance/MemberCheckInPanel";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useMemberDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Skeleton variant="rounded" height={140} sx={{ bgcolor: "#1A1D1B", borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box>
          <Typography variant="h5" sx={{ color: "#E8E3D8", mb: 0.5 }}>
            Welcome back, {user?.first_name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "#6B6F6C", fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>
              {user?.gym_code}
            </Typography>
            {user?.membership_plan && (
              <Typography variant="body2" sx={{ color: "#6B6F6C", fontSize: "0.75rem" }}>
                &middot; {user.membership_plan}
              </Typography>
            )}
          </Box>
        </Box>
        {user?.membership_expiry && (
          <Typography variant="body2" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif', fontSize: "0.75rem" }}>
            Expires: {new Date(user.membership_expiry).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Typography>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
              <PlateGauge
                value={data ? Math.min(Math.round((data.check_ins_this_month / 30) * 100), 100) : 0}
                label="CHECK-INS THIS MONTH"
                subtitle={data ? `${data.check_ins_this_month} total` : "No data yet"}
                color="#E8E3D8"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 3, gap: 0.5 }}>
              <Typography variant="h3" sx={{ fontFamily: '"JetBrains Mono", monospace', color: "#D4FF3F", fontSize: "3rem", lineHeight: 1 }}>
                {data?.total_check_ins ?? "—"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B6F6C", fontFamily: '"Anton", sans-serif', fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Total Check-Ins
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 3, gap: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography variant="h3" sx={{ fontFamily: '"JetBrains Mono", monospace', color: data?.streak && data.streak > 0 ? "#D4FF3F" : "#6B6F6C", fontSize: "3rem", lineHeight: 1 }}>
                  {data?.streak ?? "—"}
                </Typography>
                {data?.streak && data.streak > 0 && (
                  <Typography sx={{ fontSize: "1.5rem" }}>🔥</Typography>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: "#6B6F6C", fontFamily: '"Anton", sans-serif', fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Day Streak
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <MemberCheckInPanel />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <Card
            sx={{
              p: 2.5,
              cursor: "pointer",
              "&:hover": { borderColor: "rgba(232,227,216,0.2)" },
            }}
            onClick={() => navigate({ to: "/my-sessions" })}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: '"Anton", sans-serif', fontSize: "0.8rem", letterSpacing: "0.08em", color: "#E8E3D8", mb: 0.5 }}>
                  Next Session
                </Typography>
                {data?.upcoming_sessions && data.upcoming_sessions.length > 0 ? (
                  <Box>
                    <Typography variant="body1" sx={{ color: "#E8E3D8", fontFamily: '"Inter", sans-serif', fontWeight: 500 }}>
                      {data.upcoming_sessions[0].trainer_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6B6F6C", fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>
                      {new Date(data.upcoming_sessions[0].scheduled_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at {data.upcoming_sessions[0].scheduled_time}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: "#6B6F6C", fontStyle: "italic" }}>
                    No upcoming sessions &mdash; book one now
                  </Typography>
                )}
              </Box>
              <ArrowForwardIcon sx={{ color: "#6B6F6C" }} />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
