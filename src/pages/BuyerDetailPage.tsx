import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchBuyerDetail, type BuyerDetail } from '../api/admin';

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

export default function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<BuyerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setBuyer(await fetchBuyerDetail(id));
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
  if (!buyer) return <Typography>Buyer not found.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/buyers')} sx={{ mb: 2 }}>
        Back to Buyers
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>{buyer.name}</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Orders (${buyer.orders.length})`} />
        <Tab label={`Users (${buyer.users.length})`} />
      </Tabs>

      {tab === 0 && (
        buyer.orders.length === 0 ? (
          <Typography color="text.secondary">No orders yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User</TableCell>
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
                {buyer.orders.map((o) => (
                  <TableRow
                    key={o.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/orders/${o.id}`)}
                  >
                    <TableCell>{o.id}</TableCell>
                    <TableCell>
                      {o.userId != null ? (
                        <Link component={RouterLink} to={`/users/${o.userId}`} underline="hover" onClick={(e) => e.stopPropagation()}>
                          {o.userName}
                        </Link>
                      ) : (
                        o.userName
                      )}
                    </TableCell>
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
        )
      )}

      {tab === 1 && (
        buyer.users.length === 0 ? (
          <Typography color="text.secondary">No registered users for this buyer.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Registered</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {buyer.users.map((u) => (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/users/${u.id}`)}
                  >
                    <TableCell>{u.contactName}</TableCell>
                    <TableCell>{u.contactEmail}</TableCell>
                    <TableCell>{u.phone || '-'}</TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip size="small" label={u.isActive ? 'Active' : 'Inactive'} color={u.isActive ? 'success' : 'default'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}
    </Box>
  );
}
