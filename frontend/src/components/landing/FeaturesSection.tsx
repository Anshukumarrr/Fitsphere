import { Box, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { features } from "./data";

export default function FeaturesSection() {
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
          Everything You Need to Run Your Gym
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", mb: 6, maxWidth: 600, mx: "auto", fontFamily: '"Inter", sans-serif' }}
        >
          From check-in to checkout, FitSphere covers every aspect of your
          fitness business operations.
        </Typography>
        <Grid container spacing={3}>
          {features.map((f, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Card
                sx={{
                  height: "100%",
                  p: 2,
                  "&:hover": {
                    borderColor: "rgba(232,227,216,0.2)",
                    transform: "translateY(-4px)",
                    transition: "all 0.15s ease-out",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: "#E8E3D8", mb: 2 }}>{f.icon}</Box>
                  <Typography variant="h6" sx={{ mb: 1, fontSize: "1rem", color: "#E8E3D8" }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontFamily: '"Inter", sans-serif' }}>
                    {f.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
