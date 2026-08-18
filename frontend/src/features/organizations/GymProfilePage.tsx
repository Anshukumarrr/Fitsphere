import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Link,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  useGymProfile,
  useDashboard,
  useBranches,
  useTrainers,
  useMembershipPlans,
} from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import type { Branch, GymProfile } from "../../types";
import GymProfileEditDialog from "./GymProfileEditDialog";
import BranchHoursDialog from "./BranchHoursDialog";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function fmtTime(t: string | null): string {
  if (!t) return "—";
  const [hRaw, mRaw] = t.split(":");
  const h = Number(hRaw) % 24;
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(mRaw ?? "0").padStart(2, "0")} ${suffix}`;
}

function istMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

function toMinutes(t: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

/** True when at least one branch is currently open (handles overnight hours). */
function isOpenNow(branches: Branch[]): boolean {
  if (branches.length === 0) return false;
  const now = istMinutes();
  return branches.some((b) => {
    const open = toMinutes(b.opening_time);
    const close = toMinutes(b.closing_time);
    if (open === null || close === null) return false;
    // True 24x7 range (00:00 → 23:59): open all day.
    if (open === 0 && close >= 23 * 60 + 59) return true;
    if (close <= open) return now >= open || now < close; // overnight (9PM -> 6AM)
    return now >= open && now < close;
  });
}

function has24x7(branches: Branch[]): boolean {
  return branches.some((b) => {
    const open = toMinutes(b.opening_time);
    const close = toMinutes(b.closing_time);
    if (open === null || close === null) return false;
    // 24x7: opens at midnight with close at/after 23:30.
    if (open === 0 && close >= 23 * 60 + 30) return true;
    // 24x7: same open and close time = convention for always-open.
    if (open === close && open !== 0) return true;
    return false;
  });
}

function addressString(profile: GymProfile | undefined): string {
  if (!profile) return "";
  return [
    profile.address_line1,
    profile.address_line2,
    profile.city,
    profile.state,
    profile.postal_code,
    profile.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function initials(name: string): string {
  const clean = name.trim();
  if (!clean) return "?";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text);
  }
}

const DURATION_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half-yearly",
  yearly: "Yearly",
};

/* ------------------------------------------------------------------ */
/* Shared UI pieces                                                    */
/* ------------------------------------------------------------------ */

function StatusPill({ children, tone }: { children: React.ReactNode; tone: "accent" | "muted" }) {
  const accent = tone === "accent";
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.2,
        py: 0.5,
        borderRadius: 99,
        fontFamily: '"Anton", sans-serif',
        fontSize: 10.5,
        letterSpacing: 1.6,
        border: accent ? "1px solid rgba(212,255,63,0.35)" : "1px solid rgba(255,255,255,0.14)",
        color: accent ? "#D4FF3F" : "#8A8F8C",
        bgcolor: accent ? "rgba(212,255,63,0.07)" : "rgba(255,255,255,0.03)",
        whiteSpace: "nowrap",
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: 99,
          bgcolor: accent ? "#D4FF3F" : "#8A8F8C",
        }}
      />
      {children}
    </Box>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        backdropFilter: "blur(14px)",
        p: { xs: 2.5, md: 3 },
        transition: "border-color 0.15s ease-out, transform 0.15s ease-out",
        "&:hover": {
          borderColor: "rgba(232,227,216,0.25)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(212,255,63,0.1)",
              color: "#D4FF3F",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: '"Anton", sans-serif',
                fontSize: 14,
                letterSpacing: 1.8,
                color: "#E8E3D8",
                lineHeight: 1.2,
              }}
            >
              {title.toUpperCase()}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ color: "#8A8F8C", display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ width: 70, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: "#E8E3D8", wordBreak: "break-word", flex: 1 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        background: "rgba(18,18,20,0.72)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        p: 2.5,
        backdropFilter: "blur(14px)",
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Anton", sans-serif',
          fontSize: 13,
          letterSpacing: 1.8,
          color: "#E8E3D8",
          mb: 2,
          lineHeight: 1.2,
        }}
      >
        {title.toUpperCase()}
      </Typography>
      {children}
    </Box>
  );
}

function StatusRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: good ? "#D4FF3F" : "#E8E3D8" }}>
          {value}
        </Typography>
        {good !== undefined && (
          <CheckCircleIcon sx={{ fontSize: 15, color: good ? "#7AD88B" : "#6B6F6C" }} />
        )}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function GymProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const canEdit = user?.role === "gym_owner" || user?.role === "receptionist";

  const { data: profile, isLoading } = useGymProfile({ enabled: canEdit });
  const { data: dashboard } = useDashboard(canEdit);
  const { data: branchesRes } = useBranches();
  const { data: trainersRes } = useTrainers({ page_size: "100" });
  const { data: plansRes } = useMembershipPlans({ page_size: "100" });

  const [editOpen, setEditOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [flash, setFlash] = useState(false);

  const branches = branchesRes?.results ?? [];
  const trainers = trainersRes?.results ?? [];
  const plans = plansRes?.results ?? [];

  const openNow = isOpenNow(branches);
  const is24x7 = has24x7(branches);
  const address = addressString(profile);

  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!canEdit) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="warning">Only the gym owner or receptionist can view this profile.</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">Gym profile not found.</Alert>
      </Container>
    );
  }

  const stats = dashboard
    ? [
        { label: "ACTIVE MEMBERS", value: String(dashboard.active_members), icon: <GroupIcon sx={{ fontSize: 16 }} /> },
        { label: "NEW THIS MONTH", value: String(dashboard.new_members_this_month), icon: <PersonAddIcon sx={{ fontSize: 16 }} /> },
        {
          label: "REVENUE THIS MONTH",
          value: `₹${Number(dashboard.revenue_this_month).toLocaleString("en-IN")}`,
          icon: <TrendingUpIcon sx={{ fontSize: 16 }} />,
        },
        { label: "ATTENDANCE TODAY", value: String(dashboard.attendance_today), icon: <EventAvailableIcon sx={{ fontSize: 16 }} /> },
      ]
    : [];

  /* ------------------------------------------------ hero ---- */
  const hero = (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          height: { xs: "20vh", md: "27vh" },
          minHeight: 150,
          backgroundImage: profile.banner_image_url
            ? `url(${profile.banner_image_url})`
            : "linear-gradient(135deg,#1c1b19,#0d0d0c)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
      {/* Edit Profile — top-right corner of the banner */}
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => setEditOpen(true)}
          sx={{
            bgcolor: "#D4FF3F",
            color: "#0B0D0C",
            fontWeight: 700,
            "&:hover": { bgcolor: "#c8f034" },
          }}
        >
          Edit Profile
        </Button>
      </Box>

      {/* Identity row — logo overlaps the banner */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "center", md: "flex-end" },
          flexDirection: { xs: "column", md: "row" },
          mt: -4,
          mb: 2,
          px: { xs: 0, md: 1 },
          position: "relative",
        }}
      >
        <Avatar
          src={profile.picture_image_url || undefined}
          sx={{
            width: { xs: 92, md: 112 },
            height: { xs: 92, md: 112 },
            border: "5px solid #0B0D0C",
            bgcolor: "#1f1e1c",
            color: "#D4FF3F",
            fontSize: 34,
            fontFamily: '"Anton", sans-serif',
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {initials(profile.name)}
        </Avatar>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            mt: { xs: 1.5, md: 0 },
            ml: { xs: 0, md: 2.5 },
            textAlign: { xs: "center", md: "left" },
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              color: "#E8E3D8",
              fontFamily: '"Anton", sans-serif',
              fontSize: { xs: 30, md: 40 },
              letterSpacing: 1,
              lineHeight: 1.05,
            }}
          >
            {profile.name || "Untitled Gym"}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
            {profile.description
              ? profile.description.length > 220
                ? `${profile.description.slice(0, 220)}…`
                : profile.description
              : "No description yet."}
          </Typography>

          {/* Metadata row */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: { xs: "center", md: "flex-start" },
              gap: { xs: 1, md: 2.5 },
              mt: 1.5,
            }}
          >
            {profile.owner_name && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: "#D4FF3F" }} />
                <Typography variant="body2" sx={{ color: "#E8E3D8", fontWeight: 600 }}>
                  {profile.owner_name}
                </Typography>
              </Box>
            )}
            {branches.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {branches.length} {branches.length === 1 ? "branch" : "branches"}
              </Typography>
            )}
            {(profile.city || profile.state) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 16, color: "#8A8F8C" }} />
                <Typography variant="body2" color="text.secondary">
                  {[profile.city, profile.state].filter(Boolean).join(", ")}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Status badges */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mt: 1.5,
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            {branches.length > 0 && !is24x7 && (
              <StatusPill tone={openNow ? "accent" : "muted"}>{openNow ? "OPEN NOW" : "CLOSED"}</StatusPill>
            )}
            {is24x7 && <StatusPill tone="accent">24x7</StatusPill>}
            {profile.is_active && <StatusPill tone="muted">ACTIVE</StatusPill>}
            <StatusPill tone="muted">
              {trainers.length} TRAINER{trainers.length === 1 ? "" : "S"}
            </StatusPill>
            <StatusPill tone="muted">{plans.length} PLAN{plans.length === 1 ? "" : "S"}</StatusPill>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  /* ------------------------------------------- main columns ---- */
  const left = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* About the gym */}
      <SectionCard icon={<GroupIcon sx={{ fontSize: 18 }} />} title="About the gym" subtitle="Shown on the public landing page">
        <Typography variant="body1" sx={{ color: "#E8E3D8", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {profile.description || "No description yet. Click Edit Profile to add one."}
        </Typography>
      </SectionCard>

      {/* Contact information */}
      {(profile.contact_email || profile.contact_phone || address) && (
        <SectionCard icon={<EmailIcon sx={{ fontSize: 18 }} />} title="Contact information">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {profile.contact_email && (
              <ContactRow icon={<EmailIcon sx={{ fontSize: 17 }} />} label="Email" value={profile.contact_email} />
            )}
            {profile.contact_phone && (
              <ContactRow icon={<PhoneIcon sx={{ fontSize: 17 }} />} label="Phone" value={profile.contact_phone} />
            )}
            {address && <ContactRow icon={<LocationOnIcon sx={{ fontSize: 17 }} />} label="Address" value={address} />}
          </Box>
        </SectionCard>
      )}

      {/* Management team */}
      <SectionCard icon={<GroupIcon sx={{ fontSize: 18 }} />} title="Management team">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: "#1f1e1c", color: "#D4FF3F" }}>
            {initials(profile.owner_name || profile.name)}
          </Avatar>
          <Box>
            <Typography sx={{ color: "#E8E3D8", fontWeight: 600 }}>{profile.owner_name || "—"}</Typography>
            <Typography variant="body2" color="text.secondary">
              Gym Owner
            </Typography>
          </Box>
        </Box>
      </SectionCard>

      {/* Trainers */}
      {trainers.length > 0 && (
        <SectionCard
          icon={<FitnessCenterIcon sx={{ fontSize: 18 }} />}
          title="Trainers"
          subtitle={`${trainers.length} active`}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {trainers.slice(0, 8).map((t) => (
              <Box key={t.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: "rgba(212,255,63,0.12)", color: "#D4FF3F", fontSize: 15 }}>
                  {initials(t.full_name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: "#E8E3D8", fontWeight: 600 }}>
                    {t.full_name || "Trainer"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 260 }}>
                    {[t.specialization, t.branch_name].filter(Boolean).join(" · ") || "Personal trainer"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </SectionCard>
      )}

      {/* Membership plans */}
      {plans.length > 0 && (
        <SectionCard icon={<FitnessCenterIcon sx={{ fontSize: 18 }} />} title="Membership plans" subtitle={`${plans.length} available`}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {plans.map((p) => (
              <Box
                key={p.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: "#E8E3D8", fontWeight: 600 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {DURATION_LABELS[p.duration] ?? p.duration}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', color: "#D4FF3F", fontWeight: 600 }}>
                  ₹{Number(p.price).toLocaleString("en-IN")}
                </Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>
      )}

      {/* Operating hours */}
      <SectionCard
        icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
        title="Operating hours"
        action={
          <Button
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 15 }} />}
            onClick={() => setHoursOpen(true)}
            sx={{
              color: "#D4FF3F",
              borderColor: "rgba(212,255,63,0.35)",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { borderColor: "#D4FF3F", bgcolor: "rgba(212,255,63,0.08)" },
            }}
            variant="outlined"
          >
            Edit
          </Button>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {branches.map((b) => (
            <Box key={b.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" sx={{ color: "#E8E3D8", fontWeight: 600 }}>
                {b.name}
              </Typography>
              {b.opening_time && b.closing_time ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13 }}
                >
                  {fmtTime(b.opening_time)} – {fmtTime(b.closing_time)}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: "#6B6F6C", fontStyle: "italic", fontSize: 13 }}>
                  Not set
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </SectionCard>
    </Box>

  /* ------------------------------------------- branch details ---- */
  const branchDetails = (
    <SectionCard
      icon={<GroupIcon sx={{ fontSize: 18 }} />}
      title="Branch details"
      subtitle={canEdit ? "Click Edit to modify branch information" : "View only"}
      action={canEdit && (
        <Button
          size="small"
          startIcon={<EditIcon sx={{ fontSize: 15 }} />}
          onClick={() => setBranchEditOpen(true)}
          sx={{color: "#D4FF3F", borderColor: "rgba(212,255,63,0.35)", textTransform: "none", fontWeight: 600, "&:hover": { borderColor: "#D4FF3F", bgcolor: "rgba(212,255,63,0.08)" }}}
          variant="outlined"
        >
          Edit
        </Button>
      )}
    >
      {canEdit && branches.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          {branches.map((b) => (
            <Box key={b.id} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "#E8E3D8", fontWeight: 600, mb: 0.5 }}>
                {b.name}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {b.contact_email && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Email: {b.contact_email}
                  </Typography>
                )}
                {b.contact_phone && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Phone: {b.contact_phone}
                  </Typography>
                )}
                {b.address_line1 && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Address: {b.address_line1}
                  </Typography>
                )}
                {b.city && b.state && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {[b.city, b.state].filter(Boolean).join(", ")}
                  </Typography>
                )}
                {b.postal_code && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Postal code: {b.postal_code}
                  </Typography>
                )}
                {b.country && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Country: {b.country}
                  </Typography>
                )}
                {b.is_active !== undefined && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Status: {(b.is_active ? "Active" : "Inactive")}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}{!canEdit && branches.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          {branches.map((b) => (
            <Box key={b.id} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "#E8E3D8", fontWeight: 600, mb: 0.5 }}>
                {b.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {b.contact_email || b.contact_phone || b.address_line1 || "--"}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </SectionCard>
  );

  /* ------------------------------------------- right sidebar ---- */
  const right = (
    <Box sx={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 3 }}>
      {stats.length > 0 && (
        <SideCard title="Quick stats">
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            {stats.map((s) => (
              <Box
                key={s.label}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {s.icon}
                <Typography
                  sx={{
                    mt: 0.5,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#E8E3D8",
                  }}
                >
                  {s.value}
                </Typography>
                <Typography sx={{ fontSize: 10, letterSpacing: 1, color: "#8A8F8C", mt: 0.5 }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </SideCard>
      )}

      <SideCard title="Status">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <StatusRow label="Open now" value={openNow ? "Yes" : "No"} good={openNow} />
          <StatusRow label="Active" value={profile.is_active ? "Yes" : "No"} good={profile.is_active} />
          <StatusRow label="24x7" value={is24x7 ? "Yes" : "No"} good={is24x7} />
          <StatusRow label="Branches" value={String(branches.length)} />
        </Box>
      </SideCard>

      {address && (
        <SideCard title="Location">
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {address}
          </Typography>
          <Link
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              mt: 1.5,
              color: "#D4FF3F",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Open in OpenStreetMap <OpenInNewIcon sx={{ fontSize: 14 }} />
          </Link>
        </SideCard>
      )}

      {(profile.contact_email || profile.contact_phone) && (
        <SideCard title="Contact">
          {profile.contact_email && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {profile.contact_email}
              </Typography>
              <Tooltip title="Copy">
                <IconButton size="small" onClick={() => copyText(profile.contact_email!)}>
                  <ContentCopyIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          {profile.contact_phone && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {profile.contact_phone}
              </Typography>
              <Tooltip title="Copy">
                <IconButton size="small" onClick={() => copyText(profile.contact_phone ?? "")}>
                  <ContentCopyIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </SideCard>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      {hero}
      {branchDetails}
      <Grid container spacing={3} sx={{ mt: { xs: 0, md: 1 } }}>
        <Grid size={{ xs: 12, md: 8 }}>{left}</Grid>
        <Grid size={{ xs: 12, md: 4 }}>{right}</Grid>
      </Grid>

      <GymProfileEditDialog
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSaved={() => setFlash(true)}
        showActiveSwitch={user?.role === "gym_owner"}
      />
      <BranchHoursDialog
        open={hoursOpen}
        branches={branches}
        onClose={() => setHoursOpen(false)}
        onSaved={() => setFlash(true)}
      />
      <Snackbar
        open={flash}
        autoHideDuration={3000}
        onClose={() => setFlash(false)}
        message="Gym profile updated."
      />
    </Container>
  );
}