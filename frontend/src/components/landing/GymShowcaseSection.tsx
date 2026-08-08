import { Avatar, Box, Card, Container, Grid, Typography } from "@mui/material";
import { usePublicGyms } from "../../hooks/useApi";

/**
 * "Gyms we are connected with" storefront on the landing page.
 * Renders nothing until public gym data arrives, and hides entirely when no
 * active gym has a public profile (no half-dead cards).
 */
export default function GymShowcaseSection() {
  const { data: gyms, isLoading } = usePublicGyms();

  if (isLoading || !gyms || gyms.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, px: 2 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 1, color: "#E8E3D8" }}
        >
          Gyms we are connected with
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            textAlign: "center",
            mb: 6,
            maxWidth: 600,
            mx: "auto",
            fontFamily: '"Inter", sans-serif',
          }}
        >
          Real gyms already running their operations on FitSphere.
        </Typography>
        <Grid container spacing={3}>
          {gyms.map((gym) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={gym.id}>
              <Card
                sx={{
                  overflow: "hidden",
                  height: "100%",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#111",
                  transition: "border-color 0.15s ease-out, transform 0.15s ease-out",
                  "&:hover": {
                    borderColor: "rgba(232,227,216,0.25)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    height: 150,
                    backgroundImage: gym.banner_image_url
                      ? `url(${gym.banner_image_url})`
                      : "linear-gradient(135deg,#1c1b19,#0d0d0c)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    px: 2,
                    mt: "-20px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <Avatar
                    src={gym.picture_image_url || undefined}
                    sx={{
                      width: 56,
                      height: 56,
                      border: "3px solid #151515",
                      bgcolor: "#E8E3D8",
                      color: "#0B0D0C",
                      fontWeight: 700,
                    }}
                  >
                    {gym.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ pt: 2, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontSize: "1rem", color: "#E8E3D8", lineHeight: 1.2 }}
                    >
                      {gym.name}
                    </Typography>
                    {gym.owner_name && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: '"Inter", sans-serif' }}
                      >
                        {gym.owner_name}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {gym.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      px: 2,
                      pt: 1,
                      pb: 2,
                      lineHeight: 1.6,
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {gym.description}
                  </Typography>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}