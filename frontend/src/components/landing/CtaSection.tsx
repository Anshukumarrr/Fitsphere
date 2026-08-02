import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import MagneticWrap from "./MagneticWrap";

export default function CtaSection() {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: "center", py: { xs: 8, md: 10 }, px: 2 }}>
      <Container maxWidth="sm">
        <Typography variant="h3" sx={{ mb: 2, color: "#E8E3D8" }}>
          Ready to Level Up?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontFamily: '"Inter", sans-serif' }}>
          Join hundreds of gyms already using FitSphere to streamline their
          operations and grow their business.
        </Typography>
        <MagneticWrap radius={8}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => {
              window.__chalkBurst?.();
              navigate({ to: "/register" });
            }}
            sx={{ py: 1.5, px: 5, fontSize: "1rem" }}
          >
            Start Your Free Trial
          </Button>
        </MagneticWrap>
      </Container>
    </Box>
  );
}
