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
import { usePTSessions } from "../../hooks/useApi";
import PaginationBar from "../../components/common/PaginationBar";

export default function PTSessionListPage() {
  const [page, setPage] = useState(1);
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  const { data, isLoading } = usePTSessions(params);

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

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        PT Sessions
      </Typography>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
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
