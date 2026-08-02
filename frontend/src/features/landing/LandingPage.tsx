import Box from "@mui/material/Box";
import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import AtmosphereLayer from "../../components/AtmosphereLayer";
import LandingNavbar from "../../components/landing/LandingNavbar";
import LandingHero from "../../components/landing/LandingHero";
import FeaturesSection from "../../components/landing/FeaturesSection";
import PricingSection from "../../components/landing/PricingSection";
import CtaSection from "../../components/landing/CtaSection";
import LandingFooter from "../../components/landing/LandingFooter";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to the dashboard once auth resolves.
  // Until then we render the landing page immediately — never a blank screen.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <ParticlesProvider init={loadSlim}>
      <AtmosphereLayer />
      <Box sx={{ color: "#fff", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <LandingNavbar />
        <LandingHero />
        <FeaturesSection />
        <PricingSection />
        <CtaSection />
        <LandingFooter />
      </Box>
    </ParticlesProvider>
  );
}
