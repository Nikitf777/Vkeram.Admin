import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Chip,
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
import { fetchReservations } from '../api/admin';
import type { ReservationItem } from '../api/admin';

export default function ReservationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await fetchReservations(minDate || undefined, maxDate || undefined));
    } catch {
      /* ignore */
    }
  }, [minDate, maxDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Reservations</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Min Date"
          type="date"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={minDate}
          onChange={(e) => setMinDate(e.target.value)}
        />
        <TextField
          label="Max Date"
          type="date"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={maxDate}
          onChange={(e) => setMaxDate(e.target.value)}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Day</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Picked</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Confirmed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${r.orderId}`)}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.day}</TableCell>
                <TableCell>{r.startTime}</TableCell>
                <TableCell>{r.endTime}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.picked ? 'Yes' : 'No'}
                    color={r.picked ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>{r.orderId}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.isConfirmed ? 'Yes' : 'No'}
                    color={r.isConfirmed ? 'success' : 'warning'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
