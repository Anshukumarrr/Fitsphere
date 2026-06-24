import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useAttendanceLogs, useActiveCode, useGenerateCode, useCodeCheckIn } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";

function StaffCodePanel() {
  const { data: activeCode, isLoading: codeLoading } = useActiveCode();
  const generateCode = useGenerateCode();
  const code = activeCode && "code" in activeCode ? activeCode.code : null;

  const handleGenerate = () => generateCode.mutateAsync({});

  return (
    <Card sx={{ p: 4, mb: 3, textAlign: "center" }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Attendance Code
      </Typography>
      {codeLoading ? (
        <Typography>Loading...</Typography>
      ) : code ? (
        <>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "#00E676",
              fontFamily: "monospace",
              mb: 1,
            }}
          >
            {code}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Valid until 12:01 AM tomorrow
          </Typography>
        </>
      ) : (
        <>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No active code. Generate a new one for members to check in.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleGenerate}
            disabled={generateCode.isPending}
          >
            {generateCode.isPending ? "Generating..." : "Generate New Code"}
          </Button>
        </>
      )}
    </Card>
  );
}

function MemberCheckInPanel() {
  const [codeInput, setCodeInput] = useState("");
  const [success, setSuccess] = useState(false);
  const codeCheckIn = useCodeCheckIn();

  const handleSubmit = async () => {
    setSuccess(false);
    try {
      await codeCheckIn.mutateAsync({ code: codeInput.toUpperCase() });
      setSuccess(true);
      setCodeInput("");
    } catch {
      // error handled by mutation state
    }
  };

  return (
    <Card sx={{ p: 4, mb: 3, textAlign: "center" }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Mark Your Attendance
      </Typography>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Check-in successful!
        </Alert>
      )}
      {codeCheckIn.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(codeCheckIn.error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Check-in failed"}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", alignItems: "center" }}>
        <TextField
          placeholder="Enter 5-digit code"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          slotProps={{
            htmlInput: {
              sx: {
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: "1.5rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                maxLength: 5,
                width: 200,
              },
            },
          }}
        />
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={codeInput.length !== 5 || codeCheckIn.isPending}
          sx={{ height: 56 }}
        >
          {codeCheckIn.isPending ? "Checking In..." : "Check In"}
        </Button>
      </Box>
    </Card>
  );
}

export default function AttendanceListPage() {
  const { user } = useAuth();
  const { data, isLoading } = useAttendanceLogs();
  const isStaff = user?.role && ["gym_owner", "super_admin", "receptionist"].includes(user.role);
  const isMember = user?.role === "member";

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Attendance
      </Typography>

      {isStaff && <StaffCodePanel />}
      {isMember && <MemberCheckInPanel />}

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Attendance Logs
      </Typography>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Check-In Time</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Session Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Loading...</TableCell>
                </TableRow>
              ) : (
                data?.results?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.member_name}</TableCell>
                    <TableCell>{log.branch_name}</TableCell>
                    <TableCell>{new Date(log.check_in_time).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.check_in_method}
                        size="small"
                        color={log.check_in_method === "manual" ? "warning" : "info"}
                      />
                    </TableCell>
                    <TableCell>{log.session_type}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
