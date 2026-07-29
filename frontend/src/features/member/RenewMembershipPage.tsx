import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useMyMembership, useMembershipPlans } from "../../hooks/useApi";
import RazorpayCheckoutButton from "./RazorpayCheckoutButton";

export default function RenewMembershipPage() {
  const { membershipId } = useParams({ strict: false });
  const navigate = useNavigate();
  const id = Number(membershipId);
  const { data: membership, isLoading, isError } = useMyMembership(id);
  const { data: planData } = useMembershipPlans({ is_active: "true" });
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const plans = planData?.results ?? [];

  if (isLoading) {
    return <Typography sx={{ p: 3 }}>Loading...</Typography>;
  }

  if (isError) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error">Something went wrong. Please try again.</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate({ to: "/my-payments" })}>
          Go to My Payments
        </Button>
      </Box>
    );
  }

  if (!membership) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error">Membership not found.</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate({ to: "/my-payments" })}>
          Go to My Payments
        </Button>
      </Box>
    );
  }

  const expired = new Date(membership.end_date) < new Date();

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {expired ? "Reactivate Your Membership" : "Renew Your Membership"}
      </Typography>

      <Card sx={{ mb: 3, bgcolor: expired ? "#2d1a1a" : "#1a2d1a" }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">Current Plan</Typography>
          <Typography variant="h6">{membership.plan_name}</Typography>
          <Box sx={{ display: "flex", gap: 2, mt: 1, alignItems: "center" }}>
            <Chip label={expired ? "Expired" : "Active"} color={expired ? "error" : "success"} size="small" />
            <Typography variant="body2">
              {membership.start_date} – {membership.end_date}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>Choose a Plan to Renew</Typography>
      {plans.length === 0 ? (
        <Typography sx={{ color: "#6B6F6C", fontStyle: "italic" }}>
          No plans available.
        </Typography>
      ) : (
        <Card>
          <List>
            {plans.map((plan) => (
              <ListItemButton key={plan.id} selected={selectedPlan === plan.id} onClick={() => setSelectedPlan(plan.id)} sx={{ borderRadius: 1, mb: 1 }}>
                <ListItemText
                  primary={plan.name}
                  secondary={`₹${Number(plan.price).toLocaleString()} — ${plan.duration_days} days`}
                />
                {selectedPlan === plan.id && (
                  <RazorpayCheckoutButton
                    purchaseType="renewal"
                    itemId={id}
                    amount={Number(plan.price)}
                    planId={plan.id}
                    onSuccess={(paymentId) => navigate({ to: "/my-payments/$paymentId/receipt", params: { paymentId: String(paymentId) } })}
                  />
                )}
              </ListItemButton>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
}