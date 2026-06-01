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
import { fetchOrders } from '../api/admin';
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
      <Typography variant="h5" sx={{ mb: 3 }}>Orders</Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Confirmation</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Shipment</TableCell>
              <TableCell align="right">Reservations</TableCell>
              <TableCell align="right">Deliveries</TableCell>
              <TableCell align="right">Total Qty</TableCell>
              <TableCell align="right">Total Price</TableCell>
              <TableCell>Created</TableCell>
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
                <TableCell>{o.userEmail}</TableCell>
                <TableCell>
                  <Chip size="small" label={o.isConfirmed ? 'Yes' : 'No'} color={o.isConfirmed ? 'success' : 'warning'} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={o.paymentStatus} color={statusColor[o.paymentStatus] || 'default'} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={o.shipmentStatus} color={statusColor[o.shipmentStatus] || 'default'} />
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
