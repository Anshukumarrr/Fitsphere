import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Block, DeleteForever, Edit, PersonAdd } from "@mui/icons-material";
import { useDeleteMember, useHardDeleteMember, useMembers } from "../../hooks/useApi";
import PaginationBar from "../../components/common/PaginationBar";
import SearchInput from "../../components/common/SearchInput";
import MemberCreateDialog from "./MemberCreateDialog";
import MemberEditDialog from "./MemberEditDialog";
import type { Member } from "../../types";

interface BranchMemberTableProps {
  branchId: number;
}

export default function BranchMemberTable({ branchId }: BranchMemberTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogBranch, setDialogBranch] = useState<number | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ member: Member; action: "deactivate" | "delete" } | null>(null);
  const deleteMember = useDeleteMember();
  const hardDeleteMember = useHardDeleteMember();

  const params: Record<string, string> = { branch: String(branchId) };
  if (page > 1) params.page = String(page);
  if (search) params.search = search;
  const { data, isLoading } = useMembers(params);

  const members = data?.results ?? [];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, px: 2, py: 1 }}>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search members..." />
        <Button variant="contained" size="small" startIcon={<PersonAdd />} onClick={() => setDialogBranch(branchId)}>
          Add Member
        </Button>
      </Box>

      {members.length === 0 && !isLoading ? (
        <Typography color="text.secondary" sx={{ px: 2, py: 2 }}>
          No members in this branch
        </Typography>
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Gym Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Emergency Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">Loading...</TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>
                        {m.gym_code}
                      </TableCell>
                      <TableCell>{m.user?.first_name} {m.user?.last_name}</TableCell>
                      <TableCell>{m.user?.email}</TableCell>
                      <TableCell>{m.user?.phone || "-"}</TableCell>
                      <TableCell>{m.user?.membership_plan || "-"}</TableCell>
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
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => setEditMember(m)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deactivate">
                          <IconButton size="small" color="warning" onClick={() => setConfirmTarget({ member: m, action: "deactivate" })}>
                            <Block fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete permanently">
                          <IconButton size="small" color="error" onClick={() => setConfirmTarget({ member: m, action: "delete" })}>
                            <DeleteForever fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

      <MemberCreateDialog open={!!dialogBranch} branchId={dialogBranch} onClose={() => setDialogBranch(null)} />
      <MemberEditDialog open={!!editMember} member={editMember} onClose={() => setEditMember(null)} />

      <Dialog open={!!confirmTarget} onClose={() => setConfirmTarget(null)}>
        <DialogTitle>
          {confirmTarget?.action === "delete" ? "Permanently Delete Member" : "Deactivate Member"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmTarget?.action === "delete" ? (
              <>
                Are you sure you want to permanently delete <strong>{confirmTarget?.member?.user?.first_name} {confirmTarget?.member?.user?.last_name}</strong>?
                This will remove them from the database entirely. This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to deactivate <strong>{confirmTarget?.member?.user?.first_name} {confirmTarget?.member?.user?.last_name}</strong>?
                Their account will be suspended but their data will be preserved.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button
            color={confirmTarget?.action === "delete" ? "error" : "warning"}
            variant="contained"
            onClick={() => {
              if (confirmTarget) {
                if (confirmTarget.action === "delete") {
                  hardDeleteMember.mutate(confirmTarget.member.id);
                } else {
                  deleteMember.mutate(confirmTarget.member.id);
                }
                setConfirmTarget(null);
              }
            }}
          >
            {confirmTarget?.action === "delete" ? "Permanently Delete" : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
