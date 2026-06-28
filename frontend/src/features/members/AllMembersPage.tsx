import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import {
  ExpandMore,
  FitnessCenter,
  Store,
} from "@mui/icons-material";
import { useGyms, useMembers, useOrganization } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";

export default function AllMembersPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const { data: gymsData, isLoading: gymsLoading } = useGyms({ enabled: isSuperAdmin });
  const { data: orgData, isLoading: orgLoading } = useOrganization({ enabled: !isSuperAdmin });
  const { data: membersData, isLoading: membersLoading } = useMembers({ page_size: "1000" });
  const [expandedOrg, setExpandedOrg] = useState<string | false>(false);
  const [expandedBranch, setExpandedBranch] = useState<string | false>(false);

  const orgs = isSuperAdmin ? (gymsData?.results ?? []) : (orgData ? [orgData] : []);
  const members = membersData?.results ?? [];

  const membersByOrgAndBranch: Record<number, Record<number, typeof members>> = {};
  for (const m of members) {
    if (!membersByOrgAndBranch[m.organization]) {
      membersByOrgAndBranch[m.organization] = {};
    }
    const branchId = m.branch ?? 0;
    if (!membersByOrgAndBranch[m.organization][branchId]) {
      membersByOrgAndBranch[m.organization][branchId] = [];
    }
    membersByOrgAndBranch[m.organization][branchId].push(m);
  }

  const isLoading = gymsLoading || orgLoading || membersLoading;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        {isSuperAdmin ? "All Members" : "Members"}
      </Typography>
      {isSuperAdmin && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Overview of all gyms, branches, and their members across the platform
        </Typography>
      )}

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : orgs.length === 0 ? (
        <Typography color="text.secondary">No gyms found</Typography>
      ) : (
        orgs.map((org) => {
          const orgMemberCount = members.filter((m) => m.organization === org.id).length;
          return (
            <Card key={org.id} sx={{ mb: 2, overflow: "hidden" }}>
              <Accordion
                expanded={expandedOrg === `org-${org.id}`}
                onChange={(_, isExp) => setExpandedOrg(isExp ? `org-${org.id}` : false)}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                    <FitnessCenter sx={{ color: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {org.name}
                    </Typography>
                    <Chip label={`${orgMemberCount} members`} size="small" color="primary" />
                    <Chip label={`${org.branches?.length ?? 0} branches`} size="small" variant="outlined" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pb: 0 }}>
                  {org.branches?.map((branch) => {
                    const branchMembers = membersByOrgAndBranch[org.id]?.[branch.id] ?? [];
                    const isBranchExpanded = expandedBranch === `branch-${org.id}-${branch.id}`;
                    return (
                      <Accordion
                        key={branch.id}
                        expanded={isBranchExpanded}
                        onChange={(_, isExp) =>
                          setExpandedBranch(isExp ? `branch-${org.id}-${branch.id}` : false)
                        }
                        sx={{ "&:before": { display: "none" }, boxShadow: "none" }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{ borderTop: "1px solid", borderColor: "divider" }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                            <Store sx={{ color: "text.secondary", fontSize: 20 }} />
                            <Typography variant="subtitle2">{branch.name}</Typography>
                            <Chip
                              label={`${branchMembers.length} members`}
                              size="small"
                              variant="outlined"
                              color="default"
                              sx={{ ml: "auto" }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pb: 0 }}>
                          {branchMembers.length === 0 ? (
                            <Typography color="text.secondary" sx={{ px: 2, py: 2 }}>
                              No members in this branch
                            </Typography>
                          ) : (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Gym Code</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Emergency Contact</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {branchMembers.map((m) => (
                                    <TableRow key={m.id} hover>
                                      <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>
                                        {m.gym_code}
                                      </TableCell>
                                      <TableCell>
                                        {m.user?.first_name} {m.user?.last_name}
                                      </TableCell>
                                      <TableCell>{m.user?.email}</TableCell>
                                      <TableCell>{m.user?.phone || "-"}</TableCell>
                                      <TableCell sx={{ textTransform: "capitalize" }}>{m.gender || "-"}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={m.membership_status}
                                          color={m.membership_status === "active" ? "success" : m.membership_status === "expired" ? "error" : "warning"}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell>{m.membership_end_date || "-"}</TableCell>
                                      <TableCell sx={{ fontSize: "0.8rem" }}>
                                        {m.emergency_contact_name ? (
                                          <>
                                            {m.emergency_contact_name}
                                            <br />
                                            <Typography variant="caption" color="text.secondary">
                                              {m.emergency_contact_phone}
                                            </Typography>
                                          </>
                                        ) : "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            </Card>
          );
        })
      )}
    </Box>
  );
}
