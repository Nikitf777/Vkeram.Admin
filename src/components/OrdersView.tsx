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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import {
  ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { fetchBuyers, fetchUsers, translateStatus } from '../api/admin';
import type { Order, Buyer, User, AggregationItem } from '../api/admin';

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

interface OrdersViewProps {
  fetchFn: (from?: string, to?: string, isConfirmed?: boolean, paymentStatus?: string, shipmentStatus?: string, buyerId?: string, userId?: number) => Promise<Order[]>;
  fetchAggregationFn?: (groupBy: string, days: number, from?: string, to?: string, isConfirmed?: boolean, paymentStatus?: string, shipmentStatus?: string, buyerId?: string, userId?: number) => Promise<AggregationItem[]>;
  showProductQuantity?: boolean;
  hideBuyerColumn?: boolean;
  hideUserColumn?: boolean;
  hideBuyerFilter?: boolean;
  hideUserFilter?: boolean;
}

export default function OrdersView({ fetchFn, fetchAggregationFn, showProductQuantity, hideBuyerColumn, hideUserColumn, hideBuyerFilter, hideUserFilter }: OrdersViewProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [aggregation, setAggregation] = useState<AggregationItem[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [shipmentFilter, setShipmentFilter] = useState('');
  const [buyerIdFilter, setBuyerIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'aggregate'>('table');
  const [chartMetric, setChartMetric] = useState<'totalPrice' | 'totalQuantity'>('totalPrice');
  const [groupBy, setGroupBy] = useState('month');

  useEffect(() => {
    fetchBuyers().then(setBuyers).catch(() => {});
    fetchUsers().then(setUsers).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setOrders(await fetchFn(
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
  }, [fetchFn, fromDate, toDate, confirmedFilter, paymentFilter, shipmentFilter, buyerIdFilter, userIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const loadAggregation = useCallback(async () => {
    if (!fetchAggregationFn) return;
    try {
      setAggregation(await fetchAggregationFn(
        groupBy,
        7,
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
  }, [fetchAggregationFn, groupBy, fromDate, toDate, confirmedFilter, paymentFilter, shipmentFilter, buyerIdFilter, userIdFilter]);

  useEffect(() => {
    if (viewMode === 'aggregate') loadAggregation();
  }, [viewMode, loadAggregation]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="table">
            <TableChartIcon />
          </ToggleButton>
          <ToggleButton value="chart">
            <ScatterPlotIcon />
          </ToggleButton>
          {fetchAggregationFn && (
            <ToggleButton value="aggregate">
              <BarChartIcon />
            </ToggleButton>
          )}
        </ToggleButtonGroup>
      </Box>

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
        {!hideBuyerFilter && (
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
        )}
        {!hideUserFilter && (
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
        )}
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

      {viewMode === 'aggregate' && fetchAggregationFn && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Группировка</InputLabel>
              <Select
                value={groupBy}
                label="Группировка"
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <MenuItem value="day">День</MenuItem>
                <MenuItem value="week">Неделя</MenuItem>
                <MenuItem value="month">Месяц</MenuItem>
                <MenuItem value="year">Год</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Показатель</InputLabel>
              <Select
                value={chartMetric}
                label="Показатель"
                onChange={(e) => setChartMetric(e.target.value as 'totalPrice' | 'totalQuantity')}
              >
                <MenuItem value="totalPrice">Общая сумма</MenuItem>
                <MenuItem value="totalQuantity">Общее кол-во</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {aggregation.length === 0 ? (
            <Typography color="text.secondary">Нет данных для аггрегации.</Typography>
          ) : (
            <Paper sx={{ p: 2 }}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={aggregation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis
                    tickFormatter={(v: any) => chartMetric === 'totalPrice' ? v.toLocaleString() : v}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <Paper sx={{ p: 1.5 }}>
                          <Typography variant="body2">Период: {d.period}</Typography>
                          <Typography variant="body2" color="primary">
                            {chartMetric === 'totalPrice'
                              ? `Сумма: ${d.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
                              : `Кол-во: ${d.totalQuantity}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Заказов: {d.orderCount}
                          </Typography>
                        </Paper>
                      );
                    }}
                  />
                  <Bar
                    dataKey={chartMetric}
                    fill="#1976d2"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}
        </Box>
      )}

      {viewMode === 'chart' && orders.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160, mb: 2 }}>
            <InputLabel>Показатель</InputLabel>
            <Select
              value={chartMetric}
              label="Показатель"
              onChange={(e) => setChartMetric(e.target.value as 'totalPrice' | 'totalQuantity')}
            >
              <MenuItem value="totalPrice">Общая сумма</MenuItem>
              <MenuItem value="totalQuantity">Общее кол-во</MenuItem>
            </Select>
          </FormControl>
          <Paper sx={{ p: 2 }}>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="createdAt"
                  name="Дата"
                  tickFormatter={(v: any) => new Date(v).toLocaleDateString()}
                  type="category"
                />
                <YAxis
                  dataKey={chartMetric}
                  name={chartMetric === 'totalPrice' ? 'Сумма' : 'Кол-во'}
                  tickFormatter={(v: any) => chartMetric === 'totalPrice' ? v.toLocaleString() : v}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <Paper sx={{ p: 1.5 }}>
                        <Typography variant="body2">
                          {new Date(d.createdAt).toLocaleString(undefined, { hour12: false })}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {chartMetric === 'totalPrice'
                            ? `Сумма: ${d.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
                            : `Кол-во: ${d.totalQuantity}`}
                        </Typography>
                      </Paper>
                    );
                  }}
                />
                <Scatter
                  data={[...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())}
                  fill="#1976d2"
                  cursor="pointer"
                  onClick={(data: any) => navigate(`/orders/${data.id}`)}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      )}

      {viewMode === 'table' && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                {!hideBuyerColumn && <TableCell>Компания</TableCell>}
                {!hideUserColumn && <TableCell>Пользователь</TableCell>}
                <TableCell>Подтверждение</TableCell>
                <TableCell>Оплата</TableCell>
                <TableCell>Отгрузка</TableCell>
                {showProductQuantity && <TableCell align="right">Кол-во товара</TableCell>}
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
                  {!hideBuyerColumn && (
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
                  )}
                  {!hideUserColumn && (
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
                  )}
                  <TableCell>
                    <Chip size="small" label={o.isConfirmed ? 'Да' : 'Нет'} color={o.isConfirmed ? 'success' : 'warning'} />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={translateStatus(o.paymentStatus)} color={statusColor[o.paymentStatus] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={translateStatus(o.shipmentStatus)} color={statusColor[o.shipmentStatus] || 'default'} />
                  </TableCell>
                  {showProductQuantity && (
                    <TableCell align="right">{o.productQuantity ?? '-'}</TableCell>
                  )}
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
      )}
    </Box>
  );
}
