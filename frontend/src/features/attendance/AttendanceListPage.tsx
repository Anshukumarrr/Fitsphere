import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useAttendanceLogs, useActiveCode, useGenerateCode } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import MemberCheckInPanel from "./MemberCheckInPanel";
import PaginationBar from "../../components/common/PaginationBar";

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

export default function AttendanceListPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  const { data, isLoading } = useAttendanceLogs(params);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Attendance
      </Typography>

      {user?.role === "member" && <MemberCheckInPanel />}
      {user?.role && ["gym_owner", "super_admin", "receptionist"].includes(user.role) && <StaffCodePanel />}

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
        {data && <PaginationBar count={data.count} page={page} onChange={(_, v) => setPage(v)} />}
      </Card>
    </Box>
  );
}
