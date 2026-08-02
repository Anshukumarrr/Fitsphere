import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import MagneticWrap from "./MagneticWrap";

export default function LandingNavbar() {
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "rgba(11,13,12,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "none",
        boxShadow: "none",
      }}
    >
      <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto", px: { xs: 2, md: 0 } }}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", flex: 1 }}
          onClick={() => {
            window.scrollTo(0, 0);
            navigate({ to: "/" });
          }}
        >
          <FitnessCenterIcon sx={{ color: "#E8E3D8", fontSize: 28 }} />
          <Typography
            variant="h6"
            sx={{
              color: "#E8E3D8",
              fontFamily: '"Anton", sans-serif',
              letterSpacing: "0.04em",
              fontSize: "1.3rem",
            }}
          >
            FitSphere
          </Typography>
        </Box>
        <Button
          variant="text"
          sx={{ color: "#6B6F6C", mr: 1, "&:hover": { color: "#E8E3D8" } }}
          onClick={() => navigate({ to: "/login" })}
        >
          Sign In
        </Button>
        <MagneticWrap>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => navigate({ to: "/register" })}
          >
            Get Started
          </Button>
        </MagneticWrap>
      </Toolbar>
    </AppBar>
  );
}
