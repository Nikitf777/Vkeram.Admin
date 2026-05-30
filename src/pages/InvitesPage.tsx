import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fetchInvites, createInvite, revokeInvites } from '../api/admin';
import type { Invite } from '../api/admin';

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const lastClickedRef = useRef<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [companyName, setCompanyName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [createdCodes, setCreatedCodes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    try {
      setInvites(await fetchInvites());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    try {
      const result = await createInvite(count, companyName, expiresInDays);
      setCreatedCodes(result.codes);
      setDialogOpen(false);
      load();
    } catch {
      /* ignore */
    }
  };

  const copyAll = () => {
    if (createdCodes) {
      navigator.clipboard.writeText(createdCodes.join('\n'));
    }
  };

  const handleRowClick = (id: number, disabled: boolean, event: React.MouseEvent) => {
    if (disabled) return;

    if (event.shiftKey && lastClickedRef.current !== null) {
      const ids = invites.map((i) => i.id);
      const currentIdx = ids.indexOf(id);
      const lastIdx = ids.indexOf(lastClickedRef.current);
      if (currentIdx !== -1 && lastIdx !== -1) {
        const start = Math.min(currentIdx, lastIdx);
        const end = Math.max(currentIdx, lastIdx);
        const range = ids.slice(start, end + 1);
        setSelected((prev) => {
          const next = new Set(prev);
          for (const r of range) {
            const inv = invites.find((i) => i.id === r);
            if (inv && !inv.isUsed && !inv.isRevoked) next.add(r);
          }
          return next;
        });
      }
      lastClickedRef.current = id;
    } else if (event.ctrlKey || event.metaKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      lastClickedRef.current = id;
    } else {
      setSelected(new Set([id]));
      lastClickedRef.current = id;
    }
  };

  const handleCheckboxClick = (id: number, disabled: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    if (disabled) return;
    if (event.shiftKey) {
      handleRowClick(id, disabled, event);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    lastClickedRef.current = id;
  };

  const toggleAll = () => {
    const selectableIds = invites.filter((i) => !i.isUsed && !i.isRevoked).map((i) => i.id);
    if (selected.size === selectableIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableIds));
    }
  };

  const handleRevoke = async () => {
    if (selected.size === 0) return;
    try {
      await revokeInvites(Array.from(selected));
      setSelected(new Set());
      load();
    } catch {
      /* ignore */
    }
  };

  const canRevoke = invites.some((i) => selected.has(i.id) && !i.isUsed && !i.isRevoked);
  const selectableIds = invites.filter((i) => !i.isUsed && !i.isRevoked).map((i) => i.id);
  const allSelected = selectableIds.length > 0 && selected.size === selectableIds.length;
  const someSelected = selected.size > 0 && selected.size < selectableIds.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Invite Codes</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selected.size > 0 && (
            <Button variant="contained" color="error" disabled={!canRevoke} onClick={handleRevoke}>
              Revoke ({selected.size})
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCreatedCodes(null); setDialogOpen(true); }}>
            Create Invites
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={someSelected}
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Used By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invites.map((inv) => {
              const labelId = `invite-checkbox-${inv.id}`;
              const isRevoked = inv.isRevoked;
              const isUsed = inv.isUsed;
              const disabled = isUsed || isRevoked;
              const status = isUsed ? 'Used' : isRevoked ? 'Revoked' : 'Active';
              const color = isUsed ? 'default' : isRevoked ? 'error' : 'success' as const;
              return (
                <TableRow
                  key={inv.id}
                  hover
                  selected={selected.has(inv.id)}
                  onClick={(e) => handleRowClick(inv.id, disabled, e)}
                  sx={{ cursor: disabled ? 'default' : 'pointer' }}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id={labelId}
                      checked={selected.has(inv.id)}
                      onClick={(e) => handleCheckboxClick(inv.id, disabled, e)}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{inv.code}</TableCell>
                  <TableCell>{inv.companyName || '-'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={status} color={color} />
                  </TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(inv.expiresAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {inv.usedByUserId != null
                      ? <Link to={`/users/${inv.usedByUserId}`} onClick={(e) => e.stopPropagation()}>{inv.usedByCompanyName ?? '-'}</Link>
                      : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Invite Codes</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Count" type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} slotProps={{ htmlInput: { min: 1, max: 100 } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Expires (days)" type="number" value={expiresInDays} onChange={(e) => setExpiresInDays(Number(e.target.value))} slotProps={{ htmlInput: { min: 1 } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Company (optional)" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createdCodes !== null} onClose={() => setCreatedCodes(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Codes Created</DialogTitle>
        <DialogContent>
          {createdCodes?.map((c) => (
            <Typography key={c} sx={{ fontFamily: 'monospace', mb: 0.5 }}>{c}</Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<ContentCopyIcon />} onClick={copyAll}>Copy All</Button>
          <Button onClick={() => setCreatedCodes(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
