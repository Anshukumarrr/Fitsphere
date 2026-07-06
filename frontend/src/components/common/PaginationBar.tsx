import { Box, Pagination, Typography } from "@mui/material";

const PAGE_SIZE = 25;

interface PaginationBarProps {
  count: number;
  page: number;
  onChange: (_: unknown, value: number) => void;
}

export default function PaginationBar({ count, page, onChange }: PaginationBarProps) {
  const totalPages = Math.ceil(count / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {count} total
      </Typography>
      <Pagination count={totalPages} page={page} onChange={onChange} color="primary" size="small" />
    </Box>
  );
}
