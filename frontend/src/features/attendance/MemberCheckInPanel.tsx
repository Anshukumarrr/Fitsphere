import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useCodeCheckIn } from "../../hooks/useApi";

export default function MemberCheckInPanel() {
  const [code, setCode] = useState("");
  const checkIn = useCodeCheckIn();

  const handleCheckIn = async () => {
    if (!code.trim()) return;
    await checkIn.mutateAsync({ code: code.trim() });
    setCode("");
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ py: 2.5 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Anton", sans-serif', fontSize: "0.8rem", letterSpacing: "0.08em", color: "#6B6F6C", mb: 1.5 }}>
          Daily Check-In
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Enter your check-in code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") handleCheckIn(); }}
            sx={{ flex: 1, maxWidth: 320 }}
          />
          <Button
            variant="contained"
            onClick={handleCheckIn}
            disabled={!code.trim() || checkIn.isPending}
            sx={{ whiteSpace: "nowrap" }}
          >
            {checkIn.isPending ? "Checking..." : "Check In"}
          </Button>
        </Box>
        {checkIn.isError && (
          <Typography variant="caption" sx={{ color: "#FF4B3E", mt: 1, display: "block" }}>
            {(checkIn.error as Error)?.message || "Check-in failed. Try again."}
          </Typography>
        )}
        {checkIn.isSuccess && (
          <Typography variant="caption" sx={{ color: "#D4FF3F", mt: 1, display: "block" }}>
            Checked in! Let&apos;s get to work.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
