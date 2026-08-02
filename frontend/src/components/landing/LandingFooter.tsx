import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { Box, Container, Typography } from "@mui/material";

export default function LandingFooter() {
  return (
    <Box
      sx={{
        borderTop: "1px solid #2A2D2B",
        py: 4,
        px: 2,
        textAlign: "center",
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 2 }}>
          <FitnessCenterIcon sx={{ color: "#6B6F6C", fontSize: 22 }} />
          <Typography
            variant="h6"
            sx={{
              color: "#E8E3D8",
              fontFamily: '"Anton", sans-serif',
              letterSpacing: "0.04em",
              fontSize: "1.1rem",
            }}
          >
            FitSphere
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", sans-serif' }}>
          &copy; {new Date().getFullYear()} FitSphere. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
