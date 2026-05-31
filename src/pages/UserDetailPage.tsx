import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchUser, fetchUserOrders } from '../api/admin';
import type { User, Order } from '../api/admin';

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

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const uid = Number(id);
      const [userData, ordersData] = await Promise.all([
        fetchUser(uid),
        fetchUserOrders(uid),
      ]);
      setUser(userData);
      setOrders(ordersData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <CircularProgress />;
  if (!user) return <Typography>User not found.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} sx={{ mb: 2 }}>
        Back to Users
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>User #{user.id}</Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Buyer ID</Typography>
              <Typography>{user.buyerId}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Contact Name</Typography>
              <Typography>{user.contactName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography>{user.contactEmail}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Phone</Typography>
              <Typography>{user.phone || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Registered</Typography>
              <Typography>{new Date(user.createdAt).toLocaleDateString()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Box>
                <Chip size="small" label={user.isActive ? 'Active' : 'Inactive'} color={user.isActive ? 'success' : 'default'} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>Orders ({orders.length})</Typography>

      {orders.length === 0 ? (
        <Typography color="text.secondary">No orders yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
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
                    <Chip size="small" label={o.confirmationStatus} color={statusColor[o.confirmationStatus] || 'default'} />
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
      )}
    </Box>
  );
}
