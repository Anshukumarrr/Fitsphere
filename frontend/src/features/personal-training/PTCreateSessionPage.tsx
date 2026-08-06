import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { setApiErrors } from "../../hooks/setApiErrors";
import {
  useBranches,
  useCreatePTSession,
  useMembers,
  useTrainers,
} from "../../hooks/useApi";
import type { Member } from "../../types";

const DURATIONS = [30, 45, 60, 90, 120];

function memberName(m: Member): string {
  const n = `${m.user?.first_name ?? ""} ${m.user?.last_name ?? ""}`.trim();
  return n || m.user?.username || `Member #${m.id}`;
}

export default function PTCreateSessionPage() {
  const { user } = useAuth();

  const [memberId, setMemberId] = useState<string>("");
  const [trainerId, setTrainerId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: membersData, isLoading: membersLoading } = useMembers();
  const { data: trainersData, isLoading: trainersLoading } = useTrainers();
  const { data: branchesData, isLoading: branchesLoading } = useBranches();
  const createSession = useCreatePTSession();

  const members = membersData?.results ?? [];
  const trainers = trainersData?.results ?? [];
  const branches = branchesData?.results ?? [];

  const today = new Date().toISOString().split("T")[0];

  // Defaults for a trainer: themselves as the trainer, their branch, 60 min.
  const selfTrainer = trainers.find((t) => t.user_id === user?.id);
  useEffect(() => {
    if (user?.role === "trainer" && !trainerId && selfTrainer) {
      setTrainerId(String(selfTrainer.id));
    }
    if (!branchId && (user?.profile?.branch_id ?? null) != null) {
      setBranchId(String(user?.profile?.branch_id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selfTrainer, trainers.length, branches.length]);

  const clearForm = () => {
    setMemberId("");
    setTrainerId("");
    setBranchId(String(user?.profile?.branch_id ?? ""));
    setDate("");
    setTime("");
    setDuration("60");
    setFieldErrors({});
    setGeneralError("");
  };

  const handleSubmit = async () => {
    setSuccess(false);
    setFieldErrors({});
    setGeneralError("");
    if (!memberId || !trainerId || !date || !time) {
      setGeneralError("Member, session date and session time are required.");
      return;
    }
    try {
      await createSession.mutateAsync({
        member: Number(memberId),
        trainer: Number(trainerId),
        branch: branchId ? Number(branchId) : null,
        scheduled_date: date,
        scheduled_time: time,
        duration_minutes: Number(duration),
      });
      setSuccess(true);
      clearForm();
    } catch (err) {
      const general = setApiErrors(err, (key, spec: { message?: string }) => {
        setFieldErrors((prev) => ({ ...prev, [key]: spec?.message ?? "" }));
      });
      if (general) setGeneralError(general);
    }
  };

  const loading = membersLoading || trainersLoading || branchesLoading;

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
        Create PT Session
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Schedule a one-on-one personal training session. Members can also book
        on their own — this page is for staff to set sessions up directly.
      </Typography>

      <Card sx={{ p: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {success && (
            <Alert severity="success">Session created.</Alert>
          )}
          {generalError && (
            <Alert severity="error">{generalError}</Alert>
          )}

          <TextField
            select
            fullWidth
            label="Member *"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            error={!!fieldErrors.member}
            helperText={fieldErrors.member ?? (loading ? "Loading…" : undefined)}
            disabled={membersLoading}
          >
            {members.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {memberName(m)}
                {m.branch_name ? ` — ${m.branch_name}` : ""}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Trainer *"
            value={trainerId}
            onChange={(e) => setTrainerId(e.target.value)}
            error={!!fieldErrors.trainer}
            helperText={fieldErrors.trainer ?? undefined}
            disabled={trainersLoading}
          >
            {trainers.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.full_name}
                {t.specialization ? ` (${t.specialization})` : ""}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={branchesLoading}
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Date *"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, input: { inputProps: { min: today } } }}
              error={!!fieldErrors.scheduled_date}
              helperText={fieldErrors.scheduled_date ?? undefined}
            />
            <TextField
              fullWidth
              label="Time *"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!fieldErrors.scheduled_time}
              helperText={fieldErrors.scheduled_time ?? undefined}
            />
          </Box>

          <TextField
            select
            fullWidth
            label="Duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            {DURATIONS.map((d) => (
              <MenuItem key={d} value={String(d)}>
                {d} minutes
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={createSession.isPending}
          >
            {createSession.isPending ? "Creating…" : "Create Session"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}