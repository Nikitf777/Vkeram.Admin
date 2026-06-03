import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBuyers(await fetchBuyers(onlyWithUsers));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [onlyWithUsers]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Покупатели</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Только с зарегистрированными пользователями</Typography>
          <Switch checked={onlyWithUsers} onChange={(e) => setOnlyWithUsers(e.target.checked)} />
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell align="right">Зарегистрированные пользователи</TableCell>
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
      )}
    </Box>
  );
}
