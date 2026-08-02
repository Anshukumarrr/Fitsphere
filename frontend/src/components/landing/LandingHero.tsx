import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import MagneticWrap from "./MagneticWrap";

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <Box>
      <Toolbar />
      <Box
        sx={{
          textAlign: "center",
          py: { xs: 10, md: 16 },
          px: 2,
          position: "relative",
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative" }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.8rem", md: "5rem" },
              lineHeight: 1.05,
              mb: 2,
              color: "#E8E3D8",
            }}
          >
            TRACK EVERY REP.
            <br />
            RUN EVERY ROOM.
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: "auto",
              mb: 5,
              fontSize: { xs: "1rem", md: "1.15rem" },
              lineHeight: 1.6,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Manage members, trainers, branches, memberships, payments, and
            attendance — all from a single, secure dashboard. Built for gyms
            that want to scale without the chaos.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <MagneticWrap radius={8}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => {
                  window.__chalkBurst?.();
                  navigate({ to: "/register" });
                }}
                sx={{ py: 1.5, px: 4, fontSize: "1rem" }}
              >
                Start Free Trial
              </Button>
            </MagneticWrap>
            <MagneticWrap radius={6}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => navigate({ to: "/login" })}
                sx={{ py: 1.5, px: 4, fontSize: "1rem" }}
              >
                Sign In
              </Button>
            </MagneticWrap>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
