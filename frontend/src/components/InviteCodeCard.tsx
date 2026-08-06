import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  Skeleton,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useInviteCodes, type InviteCodeInfo } from "../hooks/useApi";

/**
 * Daily-rotating invite code card.
 *
 * kind="staff"  → visible to gym owners only; shows every branch's code.
 * kind="member" → visible to owner/trainer/receptionist/manager; shows their branch's code.
 *
 * The backend enforces the same role gates (403 otherwise); this component
 * also renders nothing for roles that can't use the code.
 */
export default function InviteCodeCard({ kind }: { kind: "staff" | "member" }) {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const allowed =
    kind === "staff"
      ? role === "gym_owner"
      : ["gym_owner", "trainer", "receptionist", "manager"].includes(role);

  const { data, isLoading, isError } = useInviteCodes(kind, allowed);
  const [selectedBranch, setSelectedBranch] = useState<number | "">("");
  const [copied, setCopied] = useState(false);

  if (!allowed) return null;

  const codes: InviteCodeInfo[] = data?.codes ?? [];
  const activeCode =
    kind === "staff"
      ? codes.find((c) => c.branch === selectedBranch) ?? codes[0]
      : data?.code
        ? { branch: data.branch ?? 0, branch_name: data.branch_name ?? "", code: data.code }
        : undefined;
  const branchName = kind === "staff" ? activeCode?.branch_name : data?.branch_name;
  const title = kind === "staff" ? "Staff Invite Code" : "Member Invite Code";
  const subtitle =
    kind === "staff"
      ? "Share this with staff so they can join your gym — trainers, receptionists, managers and more."
      : "Share this with members so they can sign up — the code changes every day.";

  const handleCopy = async () => {
    if (!activeCode?.code) return;
    try {
      await navigator.clipboard.writeText(activeCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fall back to nothing.
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        border: "1px solid #2A2D2B",
        bgcolor: "#1A1D1B",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6" sx={{ color: "#E8E3D8", fontWeight: 600, fontSize: "1rem" }}>
          {title}
        </Typography>
        <Chip
          label="Refreshes daily at 12:01 AM"
          size="small"
          sx={{ bgcolor: "rgba(212,255,63,0.08)", color: "#D4FF3F", border: "1px solid rgba(212,255,63,0.25)" }}
        />
      </Box>
      <Typography variant="body2" sx={{ color: "#8A8F8C", mb: 2, fontFamily: '"Inter", sans-serif' }}>
        {subtitle}
      </Typography>

      {isLoading && <Skeleton variant="rounded" height={64} sx={{ bgcolor: "#222623", borderRadius: 2 }} />}

      {isError && (
        <Alert
          severity="error"
          sx={{ backgroundColor: "rgba(255,75,62,0.1)", border: "1px solid rgba(255,75,62,0.3)", color: "#FF4B3E" }}
        >
          Couldn't load your invite code. Refresh the page to try again.
        </Alert>
      )}

      {!isLoading && !isError && !activeCode && (
        <Typography variant="body2" sx={{ color: "#8A8F8C", fontFamily: '"Inter", sans-serif' }}>
          {kind === "staff"
            ? "No branches yet — create a branch before sharing staff codes."
            : "No branch assigned to your account yet — ask your gym owner."}
        </Typography>
      )}

      {!isLoading && !isError && activeCode && (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Box
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "0.35em",
              color: "#D4FF3F",
              border: "1px dashed rgba(212,255,63,0.4)",
              borderRadius: 2,
              px: 3,
              py: 1.5,
              bgcolor: "rgba(212,255,63,0.04)",
              userSelect: "all",
            }}
          >
            {activeCode.code}
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            sx={{
              color: "#D4FF3F",
              borderColor: "rgba(212,255,63,0.4)",
              "&:hover": { borderColor: "#D4FF3F", bgcolor: "rgba(212,255,63,0.06)" },
              textTransform: "none",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
          {kind === "staff" && codes.length > 1 && (
            <Select
              size="small"
              value={selectedBranch || activeCode.branch}
              onChange={(e) => setSelectedBranch(Number(e.target.value))}
              sx={{
                minWidth: 160,
                color: "#E8E3D8",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2A2D2B" },
              }}
            >
              {codes.map((c) => (
                <MenuItem key={c.branch} value={c.branch}>
                  {c.branch_name}
                </MenuItem>
              ))}
            </Select>
          )}
          {branchName && kind === "staff" && codes.length === 1 && (
            <Typography variant="body2" sx={{ color: "#8A8F8C", fontFamily: '"Inter", sans-serif' }}>
              {branchName} branch
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
