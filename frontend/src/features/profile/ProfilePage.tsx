import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, Chip,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { useUpdateProfile } from "../../hooks/useApi";
import { useEffect, useState } from "react";
import UserAvatar from "../../components/UserAvatar";

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileFields, setProfileFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setPhone(user.phone ?? "");
      const pf: Record<string, string> = {};
      const p = user.profile;
      if (p) {
        for (const [k, v] of Object.entries(p)) {
          pf[k] = v != null ? String(v) : "";
        }
      }
      setProfileFields(pf);
    }
  }, [user]);

  if (!user) return null;

  const isTrainer = user.role === "trainer";
  const isMember = user.role === "member";
  const isStaff = ["receptionist", "cleaner", "manager", "security", "instructor", "maintenance"].includes(user.role);

  const handleFieldChange = (field: string, value: string) => {
    setProfileFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const payload: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      phone,
    };
    if (isTrainer || isMember) {
      payload.profile = { ...profileFields };
    }
    await updateProfile.mutateAsync(payload);
    await refetchUser();
    setEditing(false);
  };

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h5" sx={{ mb: 3, fontFamily: '"Anton", sans-serif', letterSpacing: "0.04em", color: "#E8E3D8" }}>
        My Profile
      </Typography>

      <Card sx={{ mb: 3, bgcolor: "#0B0D0C", border: "1px solid #2A2D2B" }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 3, py: 3 }}>
          <UserAvatar firstName={user.first_name} size={72} />
          <Box>
            <Typography variant="h6" sx={{ color: "#E8E3D8", fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>
              {user.first_name} {user.last_name}
            </Typography>
            <Chip label={user.role.replace("_", " ")} size="small" sx={{ bgcolor: "#2A2D2B", color: "#D4FF3F", textTransform: "capitalize", fontSize: "0.7rem", fontWeight: 500, mt: 0.5 }} />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, bgcolor: "#0B0D0C", border: "1px solid #2A2D2B" }}>
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
            </Box>
          ) : (
            <Box>
              <Grid container spacing={3}>
                <Grid size={6}>
                  <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Email</Typography>
                  <Typography variant="body2" sx={{ color: "#E8E3D8" }}>{user.email}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Phone</Typography>
                  <Typography variant="body2" sx={{ color: "#E8E3D8" }}>{user.phone || "—"}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Username</Typography>
                  <Typography variant="body2" sx={{ color: "#E8E3D8" }}>{user.username}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Role</Typography>
                  <Typography variant="body2" sx={{ color: "#D4FF3F", textTransform: "capitalize" }}>{user.role.replace("_", " ")}</Typography>
                </Grid>
              </Grid>
              <Button variant="text" size="small" onClick={() => setEditing(true)} sx={{ color: "#D4FF3F", mt: 1 }}>
                Edit Profile
              </Button>
            </Box>
          )}

          {editing && (
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2 }}>
              <Button variant="outlined" onClick={() => setEditing(false)} sx={{ borderColor: "#2A2D2B", color: "#6B6F6C" }}>Cancel</Button>
              <Button variant="contained" onClick={handleSave} disabled={updateProfile.isPending} sx={{ bgcolor: "#D4FF3F", color: "#0A0A0A", fontWeight: 600 }}>
                {updateProfile.isPending ? "Saving..." : "Save"}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {isMember && (
        <Card sx={{ mb: 3, bgcolor: "#0B0D0C", border: "1px solid #2A2D2B" }}>
          <CardContent sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Anton", sans-serif', fontSize: "0.8rem", letterSpacing: "0.08em", color: "#6B6F6C", mb: 2 }}>
              Membership
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Plan</Typography>
                <Typography variant="body2" sx={{ color: "#E8E3D8", fontWeight: 500 }}>{user.membership_plan || "—"}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Gym Code</Typography>
                <Typography variant="body2" sx={{ color: "#E8E3D8", fontFamily: '"JetBrains Mono", monospace' }}>{user.gym_code || "—"}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Status</Typography>
                <Chip label={profileFields.membership_status || "—"} size="small" sx={{ color: profileFields.membership_status === "active" ? "#4CAF50" : "#FF4B3E", bgcolor: "#2A2D2B", fontWeight: 500 }} />
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Expires</Typography>
                <Typography variant="body2" sx={{ color: user.membership_expiry && new Date(user.membership_expiry) < new Date() ? "#FF4B3E" : "#E8E3D8" }}>
                  {user.membership_expiry ? new Date(user.membership_expiry).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {(isTrainer || isMember) && editing && (
        <Card sx={{ mb: 3, bgcolor: "#0B0D0C", border: "1px solid #2A2D2B" }}>
          <CardContent sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Anton", sans-serif', fontSize: "0.8rem", letterSpacing: "0.08em", color: "#6B6F6C", mb: 2 }}>
              {isTrainer ? "Trainer Details" : "Additional Info"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {isTrainer && (
                <>
                  <TextField fullWidth label="Specialization" value={profileFields.specialization || ""} onChange={(e) => handleFieldChange("specialization", e.target.value)} size="small" />
                  <TextField fullWidth label="Bio" value={profileFields.bio || ""} onChange={(e) => handleFieldChange("bio", e.target.value)} size="small" multiline rows={2} />
                  <TextField fullWidth label="Qualifications" value={profileFields.qualifications || ""} onChange={(e) => handleFieldChange("qualifications", e.target.value)} size="small" />
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField fullWidth label="Years of Experience" type="number" value={profileFields.years_of_experience || ""} onChange={(e) => handleFieldChange("years_of_experience", e.target.value)} size="small" />
                    <TextField fullWidth label="Hourly Rate (₹)" type="number" value={profileFields.hourly_rate || ""} onChange={(e) => handleFieldChange("hourly_rate", e.target.value)} size="small" />
                  </Box>
                  <TextField fullWidth label="Max Members" type="number" value={profileFields.max_members || ""} onChange={(e) => handleFieldChange("max_members", e.target.value)} size="small" />
                </>
              )}
              {isMember && (
                <>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField fullWidth label="Gender" value={profileFields.gender || ""} onChange={(e) => handleFieldChange("gender", e.target.value)} size="small" />
                    <TextField fullWidth label="Date of Birth" type="date" value={profileFields.date_of_birth || ""} onChange={(e) => handleFieldChange("date_of_birth", e.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                  </Box>
                  <TextField fullWidth label="Emergency Contact Name" value={profileFields.emergency_contact_name || ""} onChange={(e) => handleFieldChange("emergency_contact_name", e.target.value)} size="small" />
                  <TextField fullWidth label="Emergency Contact Phone" value={profileFields.emergency_contact_phone || ""} onChange={(e) => handleFieldChange("emergency_contact_phone", e.target.value)} size="small" />
                  <TextField fullWidth label="Health Notes" value={profileFields.health_notes || ""} onChange={(e) => handleFieldChange("health_notes", e.target.value)} size="small" multiline rows={2} />
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {isStaff && !editing && (
        <Card sx={{ mb: 3, bgcolor: "#0B0D0C", border: "1px solid #2A2D2B" }}>
          <CardContent sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Anton", sans-serif', fontSize: "0.8rem", letterSpacing: "0.08em", color: "#6B6F6C", mb: 2 }}>
              Branch Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="caption" sx={{ color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>Branch</Typography>
                <Typography variant="body2" sx={{ color: "#E8E3D8" }}>{user.profile?.branch_name || "—"}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}


    </Box>
  );
}
