import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupsIcon from "@mui/icons-material/Groups";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BadgeIcon from "@mui/icons-material/Badge";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  Divider,
  Typography,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import { roleLandingPath } from "../../utils/roleLanding";
import MemberRegisterForm from "./MemberRegisterForm";
import OwnerRegisterForm from "./OwnerRegisterForm";
import StaffRegisterForm from "./StaffRegisterForm";

type AccountType = "owner" | "staff" | "member";

const ACCOUNT_OPTIONS: {
  type: AccountType;
  icon: ReactNode;
  title: string;
  description: string;
}[] = [
  {
    type: "owner",
    icon: <StorefrontIcon sx={{ fontSize: 32 }} />,
    title: "Gym Owner",
    description: "Create your gym and branch, then invite staff with a code",
  },
  {
    type: "staff",
    icon: <BadgeIcon sx={{ fontSize: 32 }} />,
    title: "Staff",
    description: "Trainer, receptionist, manager, instructor & more — join with your gym's code",
  },
  {
    type: "member",
    icon: <GroupsIcon sx={{ fontSize: 32 }} />,
    title: "Member",
    description: "Members, customers & users — join with a code from a staff member",
  },
];

export default function RegisterPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Already logged in? Skip the signup form once auth resolves.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: roleLandingPath(user?.role), replace: true });
    }
  }, [isAuthenticated, isLoading, user?.role, navigate]);

  const handleSuccess = (email: string) => {
    setRegisteredEmail(email);
    setSuccess(true);
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 460,
            mx: 2,
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                fontSize: 48,
                color: "#E8E3D8",
                mb: 1,
              }}
            >
              &#9993;
            </Box>
            <Typography
              variant="h1"
              sx={{ fontSize: "2.5rem", color: "#E8E3D8" }}
            >
              Check Your Email
            </Typography>
          </Box>

          <Box
            sx={{
              p: 4,
              borderRadius: 2,
              border: "1px solid #2A2D2B",
              bgcolor: "#1A1D1B",
            }}
          >
            <Typography
              variant="body1"
              sx={{ color: "#B0ACA3", mb: 2, textAlign: "center", fontFamily: '"Inter", sans-serif' }}
            >
              We sent a verification link to <strong style={{ color: "#E8E3D8" }}>{registeredEmail}</strong>.
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#8A8F8C", mb: 3, textAlign: "center", fontFamily: '"Inter", sans-serif' }}
            >
              Click the link in the email to activate your account. The link expires in 24 hours.
            </Typography>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                component="span"
                onClick={() => navigate({ to: "/login" })}
                sx={{
                  color: "#D4FF3F",
                  fontWeight: 700,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Go to Login
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          mx: 2,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4, cursor: "pointer" }} onClick={() => navigate({ to: "/" })}>
          <FitnessCenterIcon
            sx={{
              fontSize: 48,
              color: "#E8E3D8",
              mb: 1,
            }}
          />
          <Typography
            variant="h1"
            sx={{ fontSize: "2.5rem", color: "#E8E3D8" }}
          >
            FitSphere
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontFamily: '"Inter", sans-serif' }}>
            Join the Iron Empire
          </Typography>
        </Box>

        <Box
          sx={{
            p: 4,
            borderRadius: 2,
            border: "1px solid #2A2D2B",
            bgcolor: "#1A1D1B",
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, backgroundColor: "rgba(255,75,62,0.1)", border: "1px solid rgba(255,75,62,0.3)", color: "#FF4B3E" }}
            >
              {error}
            </Alert>
          )}

          {accountType === null ? (
            <>
              <Typography
                variant="subtitle2"
                sx={{ color: "#E8E3D8", mb: 2, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}
              >
                Create your account
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {ACCOUNT_OPTIONS.map((opt) => (
                  <Card
                    key={opt.type}
                    sx={{
                      bgcolor: "transparent",
                      border: "1px solid #2A2D2B",
                      borderRadius: 2,
                      "&:hover": { borderColor: "#D4FF3F", bgcolor: "rgba(212,255,63,0.04)" },
                    }}
                  >
                    <CardActionArea
                      onClick={() => {
                        setError("");
                        setAccountType(opt.type);
                      }}
                      sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}
                    >
                      <Box sx={{ color: "#D4FF3F", display: "flex" }}>{opt.icon}</Box>
                      <Box>
                        <Typography sx={{ color: "#E8E3D8", fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>
                          {opt.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#8A8F8C", fontFamily: '"Inter", sans-serif' }}>
                          {opt.description}
                        </Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            </>
          ) : accountType === "owner" ? (
            <OwnerRegisterForm onError={setError} onSuccess={handleSuccess} />
          ) : accountType === "staff" ? (
            <StaffRegisterForm onError={setError} onSuccess={handleSuccess} onBack={() => setAccountType(null)} />
          ) : (
            <MemberRegisterForm onError={setError} onSuccess={handleSuccess} onBack={() => setAccountType(null)} />
          )}

          <Divider sx={{ my: 3, borderColor: "#2A2D2B" }} />

          <Typography variant="body2" sx={{ textAlign: "center", color: "#8A8F8C" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#D4FF3F", fontWeight: 700 }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
