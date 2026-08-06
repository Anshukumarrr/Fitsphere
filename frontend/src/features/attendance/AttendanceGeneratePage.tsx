import { Box, Typography } from "@mui/material";
import AttendanceCodePanel from "./AttendanceCodePanel";
import InviteCodeCard from "../../components/InviteCodeCard";

export default function AttendanceGeneratePage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Generate Codes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontFamily: '"Inter", sans-serif' }}>
        Share codes for your gym: the <strong>staff</strong> and{" "}
        <strong>member</strong> invite codes, plus the daily attendance check-in
        code members enter at the front desk. Each rotates every day.
      </Typography>

      <InviteCodeCard kind="staff" />
      <InviteCodeCard kind="member" />
      <AttendanceCodePanel />
    </Box>
  );
}
