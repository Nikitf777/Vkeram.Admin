import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { fetchProducts } from '../api/admin';
import type { ProductWithPrice } from '../api/admin';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithPrice[]>([]);

  const load = useCallback(async () => {
    try {
      setProducts(await fetchProducts());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Products</Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Latest Price</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
