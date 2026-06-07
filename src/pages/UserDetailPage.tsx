import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchUser, fetchOrders } from '../api/admin';
import type { User } from '../api/admin';
import OrdersView from '../components/OrdersView';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setUser(await fetchUser(Number(id)));
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
  if (!user) return <Typography>Пользователь не найден.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} sx={{ mb: 2 }}>
        Назад к пользователям
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>User #{user.id}</Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Компания</Typography>
              <Typography>
                <Link component={RouterLink} to={`/buyers/${encodeURIComponent(user.buyerId)}`} underline="hover">
                  {user.buyerName || user.buyerId}
                </Link>
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Контактное лицо</Typography>
              <Typography>{user.contactName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography>{user.contactEmail}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Телефон</Typography>
              <Typography>{user.phone || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Зарегистрирован</Typography>
              <Typography>{new Date(user.createdAt).toLocaleDateString()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Статус</Typography>
              <Box>
                <Chip size="small" label={user.isActive ? 'Активен' : 'Неактивен'} color={user.isActive ? 'success' : 'default'} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>Заказы</Typography>
      <OrdersView
        fetchFn={(from, to, isConfirmed, paymentStatus, shipmentStatus, buyerId) =>
          fetchOrders(from, to, isConfirmed, paymentStatus, shipmentStatus, buyerId, Number(id))
        }
        hideUserColumn
        hideUserFilter
      />
    </Box>
  );
}
