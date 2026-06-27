import { Box, Card, CardContent, Typography, TextField, Button, Avatar } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

export default function MyProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  if (!user) return null;

  const handleSave = () => {
    // TODO: PATCH /auth/me/ to update profile
    setEditing(false);
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5, py: 3 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: "#2A2D2B", border: "1px solid rgba(107,111,108,0.15)" }}>
            {user.first_name?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: "#E8E3D8", fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>
              {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6B6F6C", fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>
              {user.gym_code}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: '"Anton", sans-serif', fontSize: "0.8rem", letterSpacing: "0.08em", color: "#6B6F6C", mb: 2 }}>
            Personal Information
          </Typography>

          {editing ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField fullWidth label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} size="small" />
                <TextField fullWidth label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} size="small" />
              </Box>
              <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} size="small" />
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={() => setEditing(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSave}>Save</Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: "flex", gap: 4, mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Email</Typography>
                  <Typography variant="body2" sx={{ color: "#E8E3D8" }}>{user.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Phone</Typography>
                  <Typography variant="body2" sx={{ color: "#E8E3D8" }}>{user.phone || "—"}</Typography>
                </Box>
              </Box>
              <Button variant="text" size="small" onClick={() => setEditing(true)} sx={{ color: "#D4FF3F" }}>
                Edit Profile
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ py: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: '"Anton", sans-serif', fontSize: "0.8rem", letterSpacing: "0.08em", color: "#6B6F6C", mb: 2 }}>
            Membership
          </Typography>
          <Box sx={{ display: "flex", gap: 4, mb: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Plan</Typography>
              <Typography variant="body2" sx={{ color: "#E8E3D8", fontWeight: 500 }}>
                {user.membership_plan || "—"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Expires</Typography>
              <Typography variant="body2" sx={{ color: user.membership_expiry && new Date(user.membership_expiry) < new Date() ? "#FF4B3E" : "#E8E3D8" }}>
                {user.membership_expiry
                  ? new Date(user.membership_expiry).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
