import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { fetchOrders, fetchBuyers, fetchUsers, translateStatus } from '../api/admin';
import type { Order, Buyer, User } from '../api/admin';

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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [shipmentFilter, setShipmentFilter] = useState('');
  const [buyerIdFilter, setBuyerIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchBuyers().then(setBuyers).catch(() => {});
    fetchUsers().then(setUsers).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setOrders(await fetchOrders(
        fromDate || undefined,
        toDate || undefined,
        confirmedFilter === 'all' ? undefined : confirmedFilter === 'true',
        paymentFilter || undefined,
        shipmentFilter || undefined,
        buyerIdFilter || undefined,
        userIdFilter === '' ? undefined : Number(userIdFilter),
      ));
    } catch {
      /* ignore */
    }
  }, [fromDate, toDate, confirmedFilter, paymentFilter, shipmentFilter, buyerIdFilter, userIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Заказы</Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          label="Дата от"
          type="date"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <TextField
          label="Дата до"
          type="date"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Подтверждение</InputLabel>
          <Select
            value={confirmedFilter}
            label="Подтверждение"
            onChange={(e) => setConfirmedFilter(e.target.value)}
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="true">Да</MenuItem>
            <MenuItem value="false">Нет</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Оплата</InputLabel>
          <Select
            value={paymentFilter}
            label="Оплата"
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="Paid">Оплачено</MenuItem>
            <MenuItem value="PartiallyPaid">Частично оплачено</MenuItem>
            <MenuItem value="Unpaid">Не оплачено</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Отгрузка</InputLabel>
          <Select
            value={shipmentFilter}
            label="Отгрузка"
            onChange={(e) => setShipmentFilter(e.target.value)}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="Shipped">Отгружено</MenuItem>
            <MenuItem value="PartiallyShipped">Частично отгружено</MenuItem>
            <MenuItem value="Unshipped">Не отгружено</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Покупатель</InputLabel>
          <Select
            value={buyerIdFilter}
            label="Покупатель"
            onChange={(e) => setBuyerIdFilter(e.target.value)}
          >
            <MenuItem value="">Все</MenuItem>
            {buyers.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Пользователь</InputLabel>
          <Select
            value={userIdFilter}
            label="Пользователь"
            onChange={(e) => setUserIdFilter(e.target.value)}
          >
            <MenuItem value="">Все</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.contactName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="text"
          size="small"
          onClick={() => {
            setFromDate('');
            setToDate('');
            setConfirmedFilter('all');
            setPaymentFilter('');
            setShipmentFilter('');
            setBuyerIdFilter('');
            setUserIdFilter('');
          }}
        >
          Сбросить
        </Button>
      </Box>

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
