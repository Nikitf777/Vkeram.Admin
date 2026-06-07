import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { fetchBuyerDetail, fetchOrders, type BuyerDetail } from '../api/admin';
import OrdersView from '../components/OrdersView';

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
  if (!buyer) return <Typography>Покупатель не найден.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/buyers')} sx={{ mb: 2 }}>
        Назад к покупателям
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>{buyer.name}</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Заказы" />
        <Tab label={`Пользователи (${buyer.users.length})`} />
      </Tabs>

      {tab === 0 && (
        <OrdersView
          fetchFn={(from, to, isConfirmed, paymentStatus, shipmentStatus, _buyerId, userId) =>
            fetchOrders(from, to, isConfirmed, paymentStatus, shipmentStatus, id, userId)
          }
          hideBuyerColumn
          hideBuyerFilter
        />
      )}

      {tab === 1 && (
        buyer.users.length === 0 ? (
          <Typography color="text.secondary">Нет зарегистрированных пользователей для этого покупателя.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Имя</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Телефон</TableCell>
                  <TableCell>Зарегистрирован</TableCell>
                  <TableCell>Статус</TableCell>
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
                      <Chip size="small" label={u.isActive ? 'Активен' : 'Неактивен'} color={u.isActive ? 'success' : 'default'} />
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
