import { useState } from "react";
import {
  Box,
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
import { useAttendanceLogs } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import AttendanceCodePanel from "./AttendanceCodePanel";
import MemberCheckInPanel from "./MemberCheckInPanel";
import PaginationBar from "../../components/common/PaginationBar";

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
      {/* Matches backend generate_code roles (gym_owner, super_admin, receptionist, manager, trainer) */}
      {user?.role && ["gym_owner", "super_admin", "receptionist", "manager", "trainer"].includes(user.role) && <AttendanceCodePanel />}

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
