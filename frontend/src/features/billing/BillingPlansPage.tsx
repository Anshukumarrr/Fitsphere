import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { useSubscriptionPlans } from "../../hooks/useApi";

export default function BillingPlansPage() {
  const { data, isLoading } = useSubscriptionPlans();

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Subscription Plans
      </Typography>

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Grid container spacing={3}>
          {data?.results?.map((plan) => (
            <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
              <Card
                sx={{
                  height: "100%",
                  border: 2,
                  borderColor: "primary.main",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 0 30px rgba(212,255,63,0.3)",
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                    ₹{plan.monthly_price}
                    <Typography component="span" variant="body2" color="text.secondary">
                      /mo
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {plan.description}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {plan.max_branches >= 999 ? "Unlimited" : `Up to ${plan.max_branches}`} branches
                    </Typography>
                    <Typography variant="body2">
                      {plan.max_members >= 999999 ? "Unlimited" : `Up to ${plan.max_members.toLocaleString()}`} members
                    </Typography>
                    <Typography variant="body2">
                      ₹{plan.annual_price}/year billed annually
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
