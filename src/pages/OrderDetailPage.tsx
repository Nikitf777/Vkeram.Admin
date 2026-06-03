import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderDetail, confirmOrder, updatePaymentStatus, updateReservationStatus, updateDeliveryStatus, type OrderDetail } from '../api/admin'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  paid: 'success',
  partiallyPaid: 'info',
  unpaid: 'warning',
  cancelled: 'error',
  shipped: 'success',
  shippedPartially: 'info',
  unshipped: 'warning',
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)

  useEffect(() => {
    if (!orderId) return
    fetchOrderDetail(Number(orderId))
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [orderId])

  const handleConfirm = async () => {
    if (!orderId) return
    setConfirming(true)
    try {
      await confirmOrder(Number(orderId))
      const updated = await fetchOrderDetail(Number(orderId))
      setOrder(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подтверждения заказа')
    } finally {
      setConfirming(false)
    }
  }

  const handlePaymentStatusChange = async (status: string) => {
    if (!orderId) return
    setUpdatingPayment(true)
    try {
      await updatePaymentStatus(Number(orderId), status)
      const updated = await fetchOrderDetail(Number(orderId))
      setOrder(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления статуса оплаты')
    } finally {
      setUpdatingPayment(false)
    }
  }

  const handleUpdateReservationStatus = async (reservationId: number, currentPicked: boolean) => {
    if (!orderId || !order?.reservations) return
    try {
      await updateReservationStatus(reservationId, !currentPicked)
      const updated = await fetchOrderDetail(Number(orderId))
      setOrder(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления бронирования')
    }
  }

  const handleUpdateDeliveryStatus = async (deliveryId: number, currentDelivered: boolean) => {
    if (!orderId || !order?.deliveries) return
    try {
      await updateDeliveryStatus(deliveryId, !currentDelivered)
      const updated = await fetchOrderDetail(Number(orderId))
      setOrder(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления доставки')
    }
  }

  if (loading) return <Skeleton variant="rectangular" height={400} />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!order) return null

  return (
    <Box>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Назад</Button>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5">Order #{order.orderId}</Typography>
            {order.userBuyerName && (
              <Typography variant="subtitle1" color="text.secondary">
                <Link
                  component="button"
                  variant="subtitle1"
                  color="text.secondary"
                  onClick={() => navigate(`/buyers/${order.userBuyerId}`)}
                  underline="hover"
                >
                  {order.userBuyerName}
                </Link>
              </Typography>
            )}
          </Box>
          {!order.isConfirmed && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? 'Подтверждение...' : 'Подтвердить заказ'}
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`Подтверждён: ${order.isConfirmed ? 'Да' : 'Нет'}`} color={order.isConfirmed ? 'success' : 'warning'} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2">Оплата:</Typography>
            <Select
              size="small"
              value={order.paymentStatus ?? 'Unpaid'}
              disabled={updatingPayment}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="Paid">Оплачен</MenuItem>
              <MenuItem value="PartiallyPaid">Частично оплачен</MenuItem>
              <MenuItem value="Unpaid">Не оплачен</MenuItem>
            </Select>
          </Box>
          <Chip label={`Отгрузка: ${order.shipmentStatus}`} color={statusColor[order.shipmentStatus ?? ''] || 'default'} />
        </Box>
        <Typography variant="body2" color="text.secondary">
            Создан: {order.createdAt ? new Date(order.createdAt).toLocaleString(undefined, { hour12: false }) : '-'}
        </Typography>
        <Typography variant="body2">
          ID пользователя: {order.userId}
        </Typography>
        <Typography variant="body2">
          Итого: {order.totalQuantity} товаров на {order.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (вкл. НДС)
        </Typography>
      </Paper>

      {order.reservations && order.reservations.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Бронирования</Typography>
          {order.reservations.map((r, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                    Слот {i + 1}: {new Date(r.startTime).toLocaleString(undefined, { hour12: false })} - {new Date(r.endTime).toLocaleString(undefined, { hour12: false })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={r.picked ? 'Собран' : 'Не собран'}
                    color={r.picked ? 'success' : 'warning'}
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleUpdateReservationStatus(r.id, r.picked)}
                  >
                    {r.picked ? 'Отметить как не собран' : 'Отметить как собран'}
                  </Button>
                </Box>
              </Box>
              {r.products && r.products.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                         <TableCell>Товар</TableCell>
                         <TableCell align="right">Кол-во</TableCell>
                         <TableCell align="right">НДС</TableCell>
                         <TableCell align="right">Цена</TableCell>
                         <TableCell align="right">Итого</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {r.products.map((p, j) => (
                        <TableRow key={j}>
                          <TableCell>{p.productName}</TableCell>
                          <TableCell align="right">{p.quantity}</TableCell>
                          <TableCell align="right">{p.vat > 0 ? `${p.vat}%` : '-'}</TableCell>
                          <TableCell align="right">{p.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                          <TableCell align="right">{p.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ))}
        </Paper>
      )}

      {order.deliveries && order.deliveries.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Доставки</Typography>
          {order.deliveries.map((d, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Доставка {i + 1}: {new Date(d.deliveryTime).toLocaleString(undefined, { hour12: false })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={d.delivered ? 'Доставлен' : 'Не доставлен'}
                    color={d.delivered ? 'success' : 'warning'}
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleUpdateDeliveryStatus(d.id, d.delivered)}
                  >
                    {d.delivered ? 'Отметить как не доставлен' : 'Отметить как доставлен'}
                  </Button>
                </Box>
              </Box>
              {d.products && d.products.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                         <TableCell>Товар</TableCell>
                         <TableCell align="right">Кол-во</TableCell>
                         <TableCell align="right">НДС</TableCell>
                         <TableCell align="right">Цена</TableCell>
                         <TableCell align="right">Итого</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {d.products.map((p, j) => (
                        <TableRow key={j}>
                          <TableCell>{p.productName}</TableCell>
                          <TableCell align="right">{p.quantity}</TableCell>
                          <TableCell align="right">{p.vat > 0 ? `${p.vat}%` : '-'}</TableCell>
                          <TableCell align="right">{p.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                          <TableCell align="right">{p.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  )
}
