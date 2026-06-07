import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Chip,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { fetchOrders, translateStatus } from '../api/admin';
import type { Order } from '../api/admin';

const statusColor: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  Confirmed: 'success',
  Unconfirmed: 'warning',
  Cancelled: 'error',
  Paid: 'success',
  PartiallyPaid: 'info',
  Unpaid: 'warning',
  Shipped: 'success',
  PartiallyShipped: 'info',
  Unshipped: 'warning',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    try {
      setOrders(await fetchOrders());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Заказы</Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Компания</TableCell>
              <TableCell>Пользователь</TableCell>
              <TableCell>Подтверждение</TableCell>
              <TableCell>Оплата</TableCell>
              <TableCell>Отгрузка</TableCell>
              <TableCell align="right">Бронирования</TableCell>
              <TableCell align="right">Доставки</TableCell>
              <TableCell align="right">Всего кол-во</TableCell>
              <TableCell align="right">Общая сумма</TableCell>
              <TableCell>Создан</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((o) => (
              <TableRow
                key={o.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <TableCell>{o.id}</TableCell>
                <TableCell>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => { e.stopPropagation(); navigate(`/buyers/${o.userBuyerId}`); }}
                    underline="hover"
                  >
                    {o.userBuyerName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => { e.stopPropagation(); navigate(`/users/${o.userId}`); }}
                    underline="hover"
                  >
                    {o.userContactName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={o.isConfirmed ? 'Да' : 'Нет'} color={o.isConfirmed ? 'success' : 'warning'} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={translateStatus(o.paymentStatus)} color={statusColor[o.paymentStatus] || 'default'} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={translateStatus(o.shipmentStatus)} color={statusColor[o.shipmentStatus] || 'default'} />
                </TableCell>
                <TableCell align="right">{o.reservationsCount}</TableCell>
                <TableCell align="right">{o.deliveriesCount}</TableCell>
                <TableCell align="right">{o.totalQuantity}</TableCell>
                <TableCell align="right">{o.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
