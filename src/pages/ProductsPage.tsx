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
import { fetchAdminProducts, updateProductHidden } from '../api/admin';
import type { AdminProduct } from '../api/admin';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleToggleHidden = async (productId: string, currentHidden: boolean) => {
    try {
      await updateProductHidden(productId, !currentHidden);
      await load();
    } catch {
      /* ignore */
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Товары</Typography>

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
