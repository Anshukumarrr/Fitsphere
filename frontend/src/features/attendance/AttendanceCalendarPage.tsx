import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import dayjs from "dayjs";
import { useMyAttendanceLogs } from "../../hooks/useApi";

export default function AttendanceCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf("month"));
  const { data, isLoading } = useMyAttendanceLogs();

  const logs = data?.results ?? [];

  const checkedInDays = useMemo(() => {
    const days = new Set<string>();
    for (const log of logs) {
      const d = dayjs(log.check_in_time).format("YYYY-MM-DD");
      days.add(d);
    }
    return days;
  }, [logs]);

  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = currentMonth.day();
  const monthLabel = currentMonth.format("MMMM YYYY");

  const today = dayjs().format("YYYY-MM-DD");
  const currentMonthStr = currentMonth.format("YYYY-MM");

  const monthCheckIns = useMemo(
    () => logs.filter((l) => dayjs(l.check_in_time).format("YYYY-MM") === currentMonthStr).length,
    [logs, currentMonthStr]
  );

  const totalCheckIns = logs.length;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const prevMonth = () => setCurrentMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth((m) => m.add(1, "month"));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        My Attendance
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="h3" sx={{ fontFamily: '"JetBrains Mono", monospace', color: "#D4FF3F" }}>
                {totalCheckIns}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Check-Ins
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="h3" sx={{ fontFamily: '"JetBrains Mono", monospace', color: "#D4FF3F" }}>
                {monthCheckIns}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="h3" sx={{ fontFamily: '"JetBrains Mono", monospace', color: checkedInDays.has(today) ? "#D4FF3F" : "#6B6F6C" }}>
                {checkedInDays.has(today) ? "Yes" : "No"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Checked In Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <IconButton onClick={prevMonth} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {monthLabel}
            </Typography>
            <IconButton onClick={nextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Box>

          <Grid container spacing={1}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Grid key={day} size={{ xs: 12 / 7 }}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", textAlign: "center", color: "#6B6F6C", fontWeight: 600, mb: 1 }}
                >
                  {day}
                </Typography>
              </Grid>
            ))}
            {calendarDays.map((d, i) => {
              if (d === null) {
                return <Grid key={`empty-${i}`} size={{ xs: 12 / 7 }} />;
              }
              const dateStr = currentMonth.date(d).format("YYYY-MM-DD");
              const isCheckedIn = checkedInDays.has(dateStr);
              const isToday = dateStr === today;
              return (
                <Grid key={dateStr} size={{ xs: 12 / 7 }}>
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 0.8,
                      borderRadius: 1,
                      bgcolor: isToday ? "rgba(212,255,63,0.1)" : "transparent",
                      border: isToday ? "1px solid rgba(212,255,63,0.3)" : "1px solid transparent",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.85rem",
                        color: isCheckedIn ? "#D4FF3F" : isToday ? "#E8E3D8" : "#6B6F6C",
                      }}
                    >
                      {d}
                    </Typography>
                    {isCheckedIn && (
                      <Typography sx={{ fontSize: "0.5rem", color: "#D4FF3F", lineHeight: 1 }}>
                        ●
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
