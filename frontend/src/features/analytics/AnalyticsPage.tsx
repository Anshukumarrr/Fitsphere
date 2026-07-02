import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { useAuth } from "../../hooks/useAuth";
import { usePlatformAnalytics, useRevenueReport } from "../../hooks/useApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { labels: { color: "#6B6F6C" } },
  },
  scales: {
    x: { ticks: { color: "#6B6F6C" }, grid: { color: "rgba(107,111,108,0.1)" } },
    y: { ticks: { color: "#6B6F6C" }, grid: { color: "rgba(107,111,108,0.1)" } },
  },
};

function SuperAdminAnalytics() {
  const { data: gymData, isLoading } = usePlatformAnalytics();

  if (isLoading) {
    return <Skeleton variant="rounded" height={400} sx={{ bgcolor: "#1A1D1B", borderRadius: 2 }} />;
  }

  if (!gymData?.length) {
    return <Typography color="text.secondary">No gym data available</Typography>;
  }

  const gymNames = gymData.map((g) => g.gym_name);
  const revenue = gymData.map((g) => g.revenue_this_month);
  const growthColors = gymData.map((g) => (g.member_growth >= 0 ? "rgba(76,175,80,0.8)" : "rgba(244,67,54,0.8)"));

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Revenue by Gym (This Month)</Typography>
            <Bar
              data={{
                labels: gymNames,
                datasets: [{
                  label: "Revenue (₹)",
                  data: revenue,
                  backgroundColor: "rgba(212,255,63,0.7)",
                  borderColor: "#D4FF3F",
                  borderWidth: 1,
                }],
              }}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } } as never}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Member Growth %</Typography>
            <Bar
              data={{
                labels: gymNames,
                datasets: [{
                  label: "Growth %",
                  data: gymData.map((g) => g.member_growth),
                  backgroundColor: growthColors,
                  borderColor: growthColors.map((c) => c.replace("0.8", "1")),
                  borderWidth: 1,
                }],
              }}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } } as never}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Gym Performance Summary</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Gym</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Members</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>New This Month</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Member Growth</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Revenue (This Month)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Revenue (Last Month)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Revenue Growth</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gymData.map((gym) => (
                    <TableRow key={gym.gym_id}>
                      <TableCell sx={{ fontWeight: 500 }}>{gym.gym_name}</TableCell>
                      <TableCell>{gym.total_members}</TableCell>
                      <TableCell>{gym.new_members_this_month}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: gym.member_growth >= 0 ? "#4CAF50" : "#F44336", fontWeight: 600 }}
                        >
                          {gym.member_growth >= 0 ? "+" : ""}{gym.member_growth}%
                        </Typography>
                      </TableCell>
                      <TableCell>₹{gym.revenue_this_month.toLocaleString()}</TableCell>
                      <TableCell>₹{gym.revenue_last_month.toLocaleString()}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: gym.revenue_growth >= 0 ? "#4CAF50" : "#F44336", fontWeight: 600 }}
                        >
                          {gym.revenue_growth >= 0 ? "+" : ""}{gym.revenue_growth}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function GymOwnerAnalytics() {
  const { data: revenueData, isLoading } = useRevenueReport("monthly");

  if (isLoading) {
    return <Skeleton variant="rounded" height={400} sx={{ bgcolor: "#1A1D1B", borderRadius: 2 }} />;
  }

  const monthly = Array.isArray(revenueData) ? revenueData : [];
  const labels = monthly.map((m: { month: string }) =>
    new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  ).reverse();
  const revenue = monthly.map((m: { total: number }) => Number(m.total)).reverse();
  const counts = monthly.map((m: { count: number }) => m.count).reverse();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Monthly Revenue Trend</Typography>
            <Line
              data={{
                labels,
                datasets: [{
                  label: "Revenue (₹)",
                  data: revenue,
                  borderColor: "#D4FF3F",
                  backgroundColor: "rgba(212,255,63,0.1)",
                  fill: true,
                  tension: 0.4,
                }],
              }}
              options={chartOptions as never}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Transaction Count</Typography>
            <Bar
              data={{
                labels,
                datasets: [{
                  label: "Transactions",
                  data: counts,
                  backgroundColor: "rgba(212,255,63,0.7)",
                  borderColor: "#D4FF3F",
                  borderWidth: 1,
                }],
              }}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } } as never}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Monthly Breakdown</Typography>
            {monthly.length === 0 ? (
              <Typography color="text.secondary">No revenue data yet</Typography>
            ) : (
              <Box>
                {monthly.map((item: { month: string; total: number; count: number }) => (
                  <Box
                    key={item.month}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography>
                      {new Date(item.month).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      ₹{Number(item.total).toLocaleString()} ({item.count} txns)
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        {isSuperAdmin ? "Platform Analytics" : "Revenue Analytics"}
      </Typography>
      {isSuperAdmin ? <SuperAdminAnalytics /> : <GymOwnerAnalytics />}
    </Box>
  );
}
