import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { plans } from "./data";
import MagneticWrap from "./MagneticWrap";

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, px: 2 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            mb: 1,
            color: "#E8E3D8",
          }}
        >
          Simple, Transparent Pricing
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", mb: 6, maxWidth: 500, mx: "auto", fontFamily: '"Inter", sans-serif' }}
        >
          Start with a 14-day free trial. No credit card required.
        </Typography>
        <Grid container spacing={4} sx={{ justifyContent: "center" }}>
          {plans.map((plan) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.name}>
              <Card
                sx={{
                  height: "100%",
                  p: 2,
                  border: "1px solid #2A2D2B",
                  position: "relative",
                  "&:hover": {
                    borderColor: "rgba(232,227,216,0.2)",
                    transform: "translateY(-4px)",
                    transition: "all 0.15s ease-out",
                  },
                }}
              >
                {plan.highlighted && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: "#2A2D2B",
                      color: "#0B0D0C",
                      px: 1.5,
                      py: 0.3,
                      borderRadius: 1,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    Popular
                  </Box>
                )}
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 0.5, color: "#E8E3D8", fontSize: "1rem" }}>
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" sx={{ mb: 0.5, color: "#E8E3D8" }}>
                    {plan.price}
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 400, fontFamily: '"Inter", sans-serif' }}
                    >
                      /mo
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: '"Inter", sans-serif' }}>
                    {plan.members} members &bull; {plan.branches}
                  </Typography>
                  <Box sx={{ my: 2 }}>
                    {plan.features.map((f) => (
                      <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
                        <CheckCircleIcon sx={{ color: "#8A8F8C", fontSize: 18 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", sans-serif' }}>
                          {f}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <MagneticWrap radius={6}>
                    <Button
                      fullWidth
                      variant={plan.highlighted ? "contained" : "outlined"}
                      color="primary"
                      sx={{ mt: 1 }}
                      onClick={() => navigate({ to: "/register" })}
                    >
                      Get Started
                    </Button>
                  </MagneticWrap>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
