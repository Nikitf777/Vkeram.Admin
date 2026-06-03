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
import { fetchDeliveries } from '../api/admin';
import type { DeliveryItem } from '../api/admin';

export default function DeliveriesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await fetchDeliveries(minDate || undefined, maxDate || undefined));
    } catch {
      /* ignore */
    }
  }, [minDate, maxDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Доставки</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Дата от"
          type="datetime-local"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={minDate}
          onChange={(e) => setMinDate(e.target.value)}
        />
        <TextField
          label="Дата до"
          type="datetime-local"
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
              <TableCell>Время доставки</TableCell>
              <TableCell>Доставлен</TableCell>
              <TableCell>ID заказа</TableCell>
              <TableCell>Подтверждён</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${d.orderId}`)}>
                <TableCell>{d.id}</TableCell>
                <TableCell>{new Date(d.deliveryTime).toLocaleString(undefined, { hour12: false })}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={d.delivered ? 'Да' : 'Нет'}
                    color={d.delivered ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>{d.orderId}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={d.isConfirmed ? 'Да' : 'Нет'}
                    color={d.isConfirmed ? 'success' : 'warning'}
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
