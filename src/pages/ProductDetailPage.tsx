import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import {
  fetchProduct,
  fetchProductPriceHistory,
  addProductPrice,
} from '../api/admin';
import type { ProductWithPrice, ProductPriceEntry } from '../api/admin';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductWithPrice | null>(null);
  const [prices, setPrices] = useState<ProductPriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [productData, priceData] = await Promise.all([
        fetchProduct(id),
        fetchProductPriceHistory(id),
      ]);
      setProduct(productData);
      setPrices(priceData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddPrice = async () => {
    if (!id) return;
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) return;
    try {
      await addProductPrice(id, price);
      setDialogOpen(false);
      setPriceInput('');
      load();
    } catch {
      /* ignore */
    }
  };

  if (loading) return <CircularProgress />;
  if (!product) return <Typography>Product not found.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')} sx={{ mb: 2 }}>
        Back to Products
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>{product.name}</Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary">Product ID</Typography>
          <Typography sx={{ fontFamily: 'monospace', mb: 1 }}>{product.id}</Typography>
          <Typography variant="caption" color="text.secondary">Current Price</Typography>
          <Typography variant="h6">
            {product.price != null ? `${product.price.toFixed(2)}` : 'No price set'}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Price History</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Price
        </Button>
      </Box>

      {prices.length === 0 ? (
        <Typography color="text.secondary">No price history.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prices.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right">{p.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Price</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            label="Price"
            type="number"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPrice} disabled={!priceInput || parseFloat(priceInput) < 0}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
