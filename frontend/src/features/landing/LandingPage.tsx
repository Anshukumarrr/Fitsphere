import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupIcon from "@mui/icons-material/Group";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PaymentsIcon from "@mui/icons-material/Payments";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SecurityIcon from "@mui/icons-material/Security";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMagneticHover } from "../../hooks/useMagneticHover";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";

function MagneticWrap({ children, radius = 6 }: { children: ReactNode; radius?: number }) {
  const { ref, x, y } = useMagneticHover(radius);
  return (
    <Box ref={ref} component={motion.div} style={{ x, y }} sx={{ display: "inline-flex" }}>
      {children}
    </Box>
  );
}

const features = [
  {
    icon: <PeopleAltIcon sx={{ fontSize: 40 }} />,
    title: "Member Management",
    desc: "Onboard, track, and manage members with profiles, health notes, attendance history, and membership status — all in one place.",
  },
  {
    icon: <StorefrontIcon sx={{ fontSize: 40 }} />,
    title: "Multi-Branch Ops",
    desc: "Run multiple gym locations under one organization. Each branch gets its own staff, members, and reporting while you stay in control.",
  },
  {
    icon: <QrCodeScannerIcon sx={{ fontSize: 40 }} />,
    title: "QR Check-In",
    desc: "Members check in by scanning a QR code at the entrance. Under 2 seconds. No queues, no paper registers, no fuss.",
  },
  {
    icon: <GroupIcon sx={{ fontSize: 40 }} />,
    title: "Trainer Management",
    desc: "Assign trainers to members, track PT sessions, monitor performance ratings, and manage specializations across branches.",
  },
  {
    icon: <PaymentsIcon sx={{ fontSize: 40 }} />,
    title: "Payments & Invoicing",
    desc: "Record membership and PT package payments. Auto-generated invoice numbers, payment history filterable by date, branch, and method.",
  },
  {
    icon: <CalendarMonthIcon sx={{ fontSize: 40 }} />,
    title: "PT Session Scheduling",
    desc: "Members book sessions with trainers. Double-booking prevention, session tracking (completed/missed/cancelled), and progress notes.",
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    title: "Analytics Dashboard",
    desc: "Real-time insights: active members, revenue trends, attendance patterns, renewal rates, and branch-wise performance comparisons.",
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: "Role-Based Access",
    desc: "Five distinct roles (Super Admin, Gym Owner, Receptionist, Trainer, Member) with strict permissions. Data isolated per tenant.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "₹2,999",
    members: "Up to 100",
    branches: "1 Branch",
    features: [
      "Core modules",
      "Member management",
      "QR check-in",
      "Basic reports",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₹7,999",
    members: "Up to 1,000",
    branches: "Multiple Branches",
    features: [
      "Everything in Starter",
      "Advanced reporting",
      "Trainer performance",
      "PT session scheduling",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "₹24,999",
    members: "Unlimited",
    branches: "Unlimited",
    features: [
      "Everything in Professional",
      "Unlimited branches & members",
      "Priority support",
      "Dedicated account manager",
      "Custom integrations",
      "99.9% uptime SLA",
      "White-label option",
    ],
    highlighted: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || isAuthenticated) return null;

  return (
    <Box sx={{ color: "#fff", minHeight: "100vh" }}>
      {/* ---- NAV ---- */}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", flex: 1 }} onClick={() => { window.scrollTo(0, 0); navigate({ to: "/" }); }}>
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
      <Toolbar />

      {/* ---- HERO ---- */}
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
                onClick={() => { window.__chalkBurst?.(); navigate({ to: "/register" }); }}
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

      {/* ---- FEATURES ---- */}
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

      {/* ---- PRICING ---- */}
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
                    <Typography
                      variant="h3"
                      sx={{
                        mb: 0.5,
                        color: "#E8E3D8",
                      }}
                    >
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
                        <Box
                          key={f}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            py: 0.5,
                          }}
                        >
                          <CheckCircleIcon
                            sx={{ color: "#6B6F6C", fontSize: 18 }}
                          />
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

      {/* ---- CTA ---- */}
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
              endIcon={<ArrowForwardIcon />}
              onClick={() => { window.__chalkBurst?.(); navigate({ to: "/register" }); }}
              sx={{ py: 1.5, px: 5, fontSize: "1rem" }}
            >
              Start Your Free Trial
            </Button>
          </MagneticWrap>
        </Container>
      </Box>

      {/* ---- FOOTER ---- */}
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
    </Box>
  );
}
