import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  Chip,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { usePTSessions, useUpdatePTSession } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import PaginationBar from "../../components/common/PaginationBar";

type SessionStatus = "scheduled" | "completed" | "missed" | "cancelled";

// Staff reach this page (owner/receptionist/trainer/manager) and may advance a
// session's lifecycle. Members manage their own sessions from /my-sessions.
const STATUS_OPTIONS: Array<{ value: SessionStatus; label: string }> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function PTSessionListPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [updateError, setUpdateError] = useState("");
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  const { data, isLoading } = usePTSessions(params);
  const updateSession = useUpdatePTSession();

  // Staff reach this page; the backend PATCH gate is IsStaff (owner/super/
  // receptionist/trainer/manager). Instructor can't reach it via nav.
  const canManage =
    !!user?.role &&
    ["gym_owner", "super_admin", "receptionist", "trainer", "manager"].includes(user.role);

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "info";
      case "completed":
        return "success";
      case "missed":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  const handleStatusChange = async (id: number, status: SessionStatus) => {
    setUpdateError("");
    setPendingId(id);
    try {
      await updateSession.mutateAsync({ id, data: { status } });
    } catch (err: any) {
      setUpdateError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Couldn't update the session."
      );
    } finally {
      setPendingId(null);
    }
  };

  const colSpan = canManage ? 8 : 7;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        PT Sessions
      </Typography>

      {updateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {updateError}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Trainer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rating</TableCell>
                {canManage && <TableCell>Update Status</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center">Loading...</TableCell>
                </TableRow>
              ) : !data?.results?.length ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ color: "#8A8F8C", fontStyle: "italic" }}>
                    No sessions booked yet.
                  </TableCell>
                </TableRow>
              ) : (
                data?.results?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.member_name}</TableCell>
                    <TableCell>{session.trainer_name}</TableCell>
                    <TableCell>{session.scheduled_date}</TableCell>
                    <TableCell>{session.scheduled_time}</TableCell>
                    <TableCell>{session.duration_minutes} min</TableCell>
                    <TableCell>
                      <Chip label={session.status} color={statusColor(session.status)} size="small" />
                    </TableCell>
                    <TableCell>{session.rating ?? "-"}</TableCell>
                    {canManage && (
                      <TableCell>
                        <Select
                          size="small"
                          value={session.status}
                          disabled={
                            pendingId === session.id ||
                            session.status === "completed" ||
                            session.status === "missed"
                          }
                          onChange={(e) => handleStatusChange(session.id, e.target.value as SessionStatus)}
                          sx={{
                            minWidth: 130,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2A2D2B" },
                          }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && <PaginationBar count={data.count} page={page} onChange={(_, v) => setPage(v)} />}
      </Card>
    </Box>
  );
}