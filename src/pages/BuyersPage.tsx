import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
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
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import { fetchBuyers, fetchOrderAggregatePerBuyer } from '../api/admin';
import type { Buyer, AggregatePeriod, AggregatePerBuyerItem } from '../api/admin';
import AggregateChart from '../components/AggregateChart';

export default function BuyersPage() {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [onlyWithUsers, setOnlyWithUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const [aggregation, setAggregation] = useState<AggregatePeriod<AggregatePerBuyerItem>[]>([]);
  const [aggLoading, setAggLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const [metric, setMetric] = useState<'totalPrice' | 'totalQuantity'>('totalPrice');

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

  const loadAggregation = useCallback(async () => {
    setAggLoading(true);
    try {
      setAggregation(await fetchOrderAggregatePerBuyer(
        groupBy,
        7,
        fromDate || undefined,
        toDate || undefined,
      ));
    } catch {
      /* ignore */
    } finally {
      setAggLoading(false);
    }
  }, [groupBy, fromDate, toDate]);

  useEffect(() => {
    if (viewMode === 'chart') loadAggregation();
  }, [viewMode, loadAggregation]);

  const chartData: AggregatePeriod<{ id: string; name: string; totalQuantity: number; totalPrice: number }>[] =
    aggregation.map((period) => ({
      period: period.period,
      items: period.items.map((item) => ({
        id: item.buyerId,
        name: item.buyerName,
        totalQuantity: item.totalQuantity,
        totalPrice: item.totalPrice,
      })),
    }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Покупатели</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="table"><TableChartIcon /></ToggleButton>
            <ToggleButton value="chart"><BarChartIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {viewMode === 'chart' && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
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
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setFromDate('');
              setToDate('');
              setGroupBy('month');
            }}
          >
            Сбросить
          </Button>
        </Box>
      )}

      {viewMode === 'chart' ? (
        aggLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <AggregateChart
            data={chartData}
            metric={metric}
            onMetricChange={setMetric}
          />
        )
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Typography variant="body2">Только с зарегистрированными пользователями</Typography>
            <Switch checked={onlyWithUsers} onChange={(e) => setOnlyWithUsers(e.target.checked)} />
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
        </>
      )}
    </Box>
  );
}
