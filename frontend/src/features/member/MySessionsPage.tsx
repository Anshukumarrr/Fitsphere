import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { useMySessions, useBookSession, useAvailableTrainers } from "../../hooks/useApi";

export default function MySessionsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useMySessions();
  const bookSession = useBookSession();
  const [open, setOpen] = useState(false);
  const [trainerId, setTrainerId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const memberBranchId = (user as { member_profile?: { branch?: number | null } })?.member_profile?.branch ?? null;

  const { data: trainers } = useAvailableTrainers(memberBranchId);

  const handleBook = async () => {
    if (!trainerId || !date || !time) return;
    await bookSession.mutateAsync({
      trainer: Number(trainerId),
      scheduled_date: date,
      scheduled_time: time,
    });
    setOpen(false);
    setTrainerId("");
    setDate("");
    setTime("");
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "success";
      case "completed": return "default";
      case "missed": return "error";
      case "cancelled": return "warning";
      default: return "default";
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">My Sessions</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Book Session
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Trainer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Loading...</TableCell>
                </TableRow>
              ) : data?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: "#6B6F6C", fontStyle: "italic" }}>
                    No sessions yet. Book your first one!
                  </TableCell>
                </TableRow>
              ) : (
                data?.results?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {new Date(session.scheduled_date).toLocaleDateString("en-IN", {
                        weekday: "short", day: "numeric", month: "short",
                      })}
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {session.scheduled_time}
                    </TableCell>
                    <TableCell>{session.trainer_name}</TableCell>
                    <TableCell>
                      <Chip label={session.status} color={statusColor(session.status) as "success" | "default" | "error" | "warning"} size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {session.progress_notes || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book a PT Session</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              label="Trainer"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              {(trainers?.results ?? []).map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.full_name} {t.specialization ? `(${t.specialization})` : ""}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Button
              variant="contained"
              onClick={handleBook}
              disabled={!trainerId || !date || !time || bookSession.isPending}
              sx={{ mt: 1 }}
            >
              {bookSession.isPending ? "Booking..." : "Confirm Booking"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
