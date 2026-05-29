import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fetchInvites, createInvite } from '../api/admin';
import type { Invite } from '../api/admin';

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Invite Codes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCreatedCodes(null); setDialogOpen(true); }}>
          Create Invites
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Used By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invites.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{inv.code}</TableCell>
                <TableCell>{inv.companyName || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={inv.isUsed ? 'Used' : 'Active'} color={inv.isUsed ? 'default' : 'success'} />
                </TableCell>
                <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(inv.expiresAt).toLocaleDateString()}</TableCell>
                <TableCell>{inv.usedByUserId ?? '-'}</TableCell>
              </TableRow>
            ))}
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
