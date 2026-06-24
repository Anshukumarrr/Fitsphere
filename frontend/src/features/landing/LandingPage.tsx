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

  return (
    <Box sx={{ backgroundColor: "#0A0A0A", color: "#fff", minHeight: "100vh" }}>
      {/* ---- NAV ---- */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #2A2A2A",
          boxShadow: "none",
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto", px: { xs: 2, md: 0 } }}>
          <FitnessCenterIcon sx={{ color: "#FF6D00", fontSize: 28, mr: 1 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.02em",
              flex: 1,
              background: "linear-gradient(135deg, #FF6D00 0%, #FF9100 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FitSphere
          </Typography>
          <Button
            variant="text"
            sx={{ color: "#aaa", mr: 1 }}
            onClick={() => navigate({ to: "/login" })}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => navigate({ to: "/register" })}
          >
            Get Started
          </Button>
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
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-30%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "800px",
            background:
              "radial-gradient(circle, rgba(255,109,0,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative" }}>
          <FitnessCenterIcon
            sx={{
              fontSize: 64,
              color: "#FF6D00",
              mb: 2,
              filter: "drop-shadow(0 0 30px rgba(255,109,0,0.3))",
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2.5rem", md: "4rem" },
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              mb: 2,
              background:
                "linear-gradient(135deg, #fff 0%, #FF9E40 50%, #FF6D00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            The Operating System
            <br />
            for Your Gym
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: "auto",
              mb: 5,
              fontWeight: 400,
              fontSize: { xs: "1rem", md: "1.2rem" },
              lineHeight: 1.6,
            }}
          >
            Manage members, trainers, branches, memberships, payments, and
            attendance — all from a single, secure dashboard. Built for gyms
            that want to scale without the chaos.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate({ to: "/register" })}
              sx={{ py: 1.5, px: 4, fontSize: "1rem" }}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate({ to: "/login" })}
              sx={{ py: 1.5, px: 4, fontSize: "1rem" }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ---- FEATURES ---- */}
      <Box sx={{ py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              textAlign: "center",
              mb: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Everything You Need to Run Your Gym
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", mb: 6, maxWidth: 600, mx: "auto" }}
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
                    backgroundColor: "#111",
                    border: "1px solid #2A2A2A",
                    "&:hover": {
                      borderColor: "#FF6D00",
                      transform: "translateY(-4px)",
                      transition: "all 0.3s ease",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ color: "#FF6D00", mb: 2 }}>{f.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: "1rem" }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
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
      <Box sx={{ py: { xs: 8, md: 12 }, px: 2, backgroundColor: "#0D0D0D" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              textAlign: "center",
              mb: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Simple, Transparent Pricing
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", mb: 6, maxWidth: 500, mx: "auto" }}
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
                    backgroundColor: plan.highlighted ? "#181818" : "#111",
                    border: plan.highlighted
                      ? "2px solid #FF6D00"
                      : "1px solid #2A2A2A",
                    position: "relative",
                  }}
                >
                  {plan.highlighted && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        backgroundColor: "#FF6D00",
                        color: "#000",
                        px: 1.5,
                        py: 0.3,
                        borderRadius: 1,
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      Popular
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {plan.name}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        mb: 0.5,
                        color: plan.highlighted ? "#FF6D00" : "#fff",
                      }}
                    >
                      {plan.price}
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 400 }}
                      >
                        /mo
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                            sx={{ color: "#00E676", fontSize: 18 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {f}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      fullWidth
                      variant={plan.highlighted ? "contained" : "outlined"}
                      color="primary"
                      sx={{ mt: 1 }}
                      onClick={() => navigate({ to: "/register" })}
                    >
                      Get Started
                    </Button>
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
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, letterSpacing: "-0.02em" }}>
            Ready to Level Up?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Join hundreds of gyms already using FitSphere to streamline their
            operations and grow their business.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate({ to: "/register" })}
            sx={{ py: 1.5, px: 5, fontSize: "1rem" }}
          >
            Start Your Free Trial
          </Button>
        </Container>
      </Box>

      {/* ---- FOOTER ---- */}
      <Box
        sx={{
          borderTop: "1px solid #2A2A2A",
          py: 4,
          px: 2,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 2 }}>
            <FitnessCenterIcon sx={{ color: "#FF6D00", fontSize: 22 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                background: "linear-gradient(135deg, #FF6D00 0%, #FF9100 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              FitSphere
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} FitSphere. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
