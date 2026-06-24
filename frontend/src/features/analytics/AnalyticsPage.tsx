import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { useRevenueReport } from "../../hooks/useApi";

export default function AnalyticsPage() {
  const { data: revenueData, isLoading } = useRevenueReport("monthly");

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Revenue Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Revenue
              </Typography>
              {isLoading ? (
                <Typography>Loading...</Typography>
              ) : Array.isArray(revenueData) ? (
                <Box>
                  {revenueData.map(
                    (item: { month: string; total: number; count: number }) => (
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
                          {new Date(item.month).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                          })}
                        </Typography>
                        <Typography sx={{ fontWeight: 600 }}>
                          ₹{Number(item.total).toLocaleString()} ({item.count} txns)
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>
              ) : (
                <Typography>
                  Total Revenue: ₹
                  {Number((revenueData as { total_revenue: number })?.total_revenue || 0).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
