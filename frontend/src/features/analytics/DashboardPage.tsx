import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import {
  AttachMoney,
  CalendarMonth,
  Group,
  People,
  TrendingUp,
} from "@mui/icons-material";
import { useDashboard } from "../../hooks/useApi";

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box
            sx={{
              bgcolor: color,
              borderRadius: 2,
              p: 1,
              display: "flex",
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Active Members"
            value={data?.active_members ?? 0}
            icon={<People sx={{ color: "#fff" }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="New Members (This Month)"
            value={data?.new_members_this_month ?? 0}
            icon={<TrendingUp sx={{ color: "#fff" }} />}
            color="#388e3c"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Revenue (This Month)"
            value={`₹${Number(data?.revenue_this_month ?? 0).toLocaleString()}`}
            icon={<AttachMoney sx={{ color: "#fff" }} />}
            color="#f57c00"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Revenue Today"
            value={`₹${Number(data?.revenue_today ?? 0).toLocaleString()}`}
            icon={<AttachMoney sx={{ color: "#fff" }} />}
            color="#d32f2f"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Attendance Today"
            value={data?.attendance_today ?? 0}
            icon={<CalendarMonth sx={{ color: "#fff" }} />}
            color="#7b1fa2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Expiring This Month"
            value={data?.expiring_this_month ?? 0}
            icon={<Group sx={{ color: "#fff" }} />}
            color="#c62828"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
