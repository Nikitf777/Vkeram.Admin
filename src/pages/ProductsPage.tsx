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
import { fetchAdminProducts, updateProductHidden, fetchOrderAggregatePerProduct } from '../api/admin';
import type { AdminProduct, AggregatePeriod, AggregatePerProductItem } from '../api/admin';
import AggregateChart from '../components/AggregateChart';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const [aggregation, setAggregation] = useState<AggregatePeriod<AggregatePerProductItem>[]>([]);
  const [aggLoading, setAggLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const [metric, setMetric] = useState<'totalPrice' | 'totalQuantity'>('totalPrice');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await fetchAdminProducts());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadAggregation = useCallback(async () => {
    setAggLoading(true);
    try {
      setAggregation(await fetchOrderAggregatePerProduct(
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

  const handleToggleHidden = async (productId: string, currentHidden: boolean) => {
    try {
      await updateProductHidden(productId, !currentHidden);
      await load();
    } catch {
      /* ignore */
    }
  };

  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const chartData: AggregatePeriod<{ id: string; name: string; totalQuantity: number; totalPrice: number }>[] =
    aggregation.map((period) => ({
      period: period.period,
      items: period.items.map((item) => ({
        id: item.productId,
        name: productMap.get(item.productId) ?? item.productId,
        totalQuantity: item.totalQuantity,
        totalPrice: item.totalPrice,
      })),
    }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Товары</Typography>
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

      {viewMode === 'chart' && (
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
      ) : loading ? (
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
                <TableCell align="right">Последняя цена</TableCell>
                <TableCell align="right">НДС</TableCell>
                <TableCell align="center">Скрыт</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/products/${encodeURIComponent(p.id)}`)}
                >
                  <TableCell sx={{ fontFamily: 'monospace' }}>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell align="right">
                    {p.price != null ? `${p.price.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell align="right">{p.vat > 0 ? `${p.vat}%` : '-'}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={p.isHidden}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleHidden(p.id, p.isHidden)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
