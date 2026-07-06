import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useStaff } from "../../hooks/useApi";
import PaginationBar from "../../components/common/PaginationBar";
import SearchInput from "../../components/common/SearchInput";

interface StaffRoleAccordionProps {
  role: string;
  label: string;
  color: string;
}

export default function StaffRoleAccordion({ role, label, color }: StaffRoleAccordionProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const params: Record<string, string> = { role };
  if (page > 1) params.page = String(page);
  if (search) params.search = search;
  const { data, isLoading } = useStaff(params);

  const staffList = data?.results ?? [];

  return (
    <Accordion
      sx={{
        mb: 1,
        bgcolor: "#1A1D1B",
        border: "1px solid #2A2D2B",
        borderRadius: "8px !important",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore sx={{ color: "#6B6F6C" }} />}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
            {label}
          </Typography>
          <Chip
            label={data?.count ?? 0}
            size="small"
            sx={{
              bgcolor: `${color}22`,
              color,
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2, py: 1 }}>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={`Search ${label.toLowerCase()}...`} />
        </Box>
        {staffList.length === 0 && !isLoading ? (
          <Typography sx={{ p: 2, color: "#6B6F6C" }}>
            No {label.toLowerCase()} yet.
          </Typography>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Branch Details</TableCell>
                    {role === "trainer" && <TableCell>Specialization</TableCell>}
                    {role === "trainer" && <TableCell>Experience</TableCell>}
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={role === "trainer" ? 8 : 6} align="center">Loading...</TableCell>
                    </TableRow>
                  ) : (
                    staffList.map((s) => (
                      <TableRow key={`${s.role}-${s.id}`}>
                        <TableCell>{s.full_name}</TableCell>
                        <TableCell>{s.user?.email || "-"}</TableCell>
                        <TableCell>{s.user?.phone || "-"}</TableCell>
                        <TableCell>{s.branch_name || "-"}</TableCell>
                        <TableCell sx={{ maxWidth: 200, fontSize: "0.8rem", whiteSpace: "normal", wordBreak: "break-word" }}>
                          {s.branch_details ? (
                            <>
                              {s.branch_details.address_line1 && <>{s.branch_details.address_line1}, </>}
                              {s.branch_details.city && <>{s.branch_details.city}, </>}
                              {s.branch_details.state && <>{s.branch_details.state}</>}
                              {s.branch_details.contact_phone && <><br />{s.branch_details.contact_phone}</>}
                            </>
                          ) : "-"}
                        </TableCell>
                        {role === "trainer" && <TableCell>{s.specialization || "-"}</TableCell>}
                        {role === "trainer" && <TableCell>{s.years_of_experience ? `${s.years_of_experience} yrs` : "-"}</TableCell>}
                        <TableCell>
                          <Chip label={s.is_active ? "Active" : "Inactive"} size="small" color={s.is_active ? "success" : "default"} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {data && <PaginationBar count={data.count} page={page} onChange={(_, v) => setPage(v)} />}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
