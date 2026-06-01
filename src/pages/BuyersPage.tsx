import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { fetchBuyers } from '../api/admin';
import type { Buyer } from '../api/admin';

export default function BuyersPage() {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [onlyWithUsers, setOnlyWithUsers] = useState(false);

  const load = useCallback(async () => {
    try {
      setBuyers(await fetchBuyers(onlyWithUsers));
    } catch {
      /* ignore */
    }
  }, [onlyWithUsers]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Buyers</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Only with registered users</Typography>
          <Switch checked={onlyWithUsers} onChange={(e) => setOnlyWithUsers(e.target.checked)} />
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Registered Users</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {buyers.map((b) => (
              <TableRow key={b.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/buyers/${encodeURIComponent(b.id)}`)}>
                <TableCell>{b.id}</TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell align="right">{b.registeredUsers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
