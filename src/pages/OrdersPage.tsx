import { Box, Typography } from '@mui/material';
import OrdersView from '../components/OrdersView';
import { fetchOrders, fetchOrderAggregateAll } from '../api/admin';

export default function OrdersPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Заказы</Typography>
      <OrdersView fetchFn={fetchOrders} fetchAggregationFn={fetchOrderAggregateAll} />
    </Box>
  );
}
