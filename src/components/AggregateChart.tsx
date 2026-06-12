import { useMemo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { AggregatePeriod } from '../api/admin';

const PALETTE = [
  '#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2',
  '#00796b', '#c2185b', '#546e7a', '#689f38', '#e64a19',
  '#512da8', '#303f9f', '#00838f', '#fbc02d', '#5d4037',
  '#6a1b9a', '#4527a0', '#2e7d32', '#bf360c', '#37474f',
];

interface AggregateChartProps {
  data: AggregatePeriod<{ id: string; name: string; totalQuantity: number; totalPrice: number }>[];
  metric: 'totalPrice' | 'totalQuantity';
  onMetricChange: (metric: 'totalPrice' | 'totalQuantity') => void;
}

export default function AggregateChart({ data, metric, onMetricChange }: AggregateChartProps) {
  const { categories, chartData } = useMemo(() => {
    const catSet = new Set<string>();
    const seen = new Set<string>();
    const items: { id: string; name: string }[] = [];

    for (const period of data) {
      for (const item of period.items) {
        catSet.add(item.id);
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push({ id: item.id, name: item.name });
        }
      }
    }

    const categories = items.map((item, i) => ({
      id: item.id,
      name: item.name,
      color: PALETTE[i % PALETTE.length],
    }));

    const chartData = data.map((period) => {
      const point: Record<string, string | number> = { period: period.period };
      for (const item of period.items) {
        point[item.id] = metric === 'totalPrice' ? item.totalPrice : item.totalQuantity;
      }
      for (const cat of categories) {
        if (!(cat.id in point)) {
          point[cat.id] = 0;
        }
      }
      return point;
    });

    return { categories, chartData };
  }, [data, metric]);

  if (data.length === 0) {
    return <Typography color="text.secondary">Нет данных для отображения.</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Показатель</InputLabel>
          <Select
            value={metric}
            label="Показатель"
            onChange={(e) => onMetricChange(e.target.value as 'totalPrice' | 'totalQuantity')}
          >
            <MenuItem value="totalPrice">Общая сумма</MenuItem>
            <MenuItem value="totalQuantity">Общее кол-во</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(v: any) => metric === 'totalPrice' ? v.toLocaleString() : v} />
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const period = payload[0].payload.period;
                return (
                  <Paper sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>Период: {period}</Typography>
                    {payload.filter((p: any) => p.value > 0).map((p: any) => (
                      <Typography key={p.dataKey} variant="body2" sx={{ color: p.color }}>
                        {p.name}: {metric === 'totalPrice'
                          ? p.value.toLocaleString('en-US', { style: 'currency', currency: 'BYN' })
                          : p.value}
                      </Typography>
                    ))}
                  </Paper>
                );
              }}
            />
            <Legend />
            {categories.map((cat) => (
              <Bar
                key={cat.id}
                dataKey={cat.id}
                name={cat.name}
                stackId="stack"
                fill={cat.color}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
