import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderDetail, confirmOrder, updateReservationStatus, updateDeliveryStatus, type OrderDetail } from '../api/admin'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
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
      setError(err instanceof Error ? err.message : 'Failed to confirm order')
    } finally {
      setConfirming(false)
    }
  }

  const handleUpdateReservationStatus = async (reservationId: number, currentPicked: boolean) => {
    if (!orderId || !order?.reservations) return
    try {
      await updateReservationStatus(reservationId, !currentPicked)
      const updated = await fetchOrderDetail(Number(orderId))
      setOrder(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reservation')
    }
  }

  const handleUpdateDeliveryStatus = async (deliveryId: number, currentDelivered: boolean) => {
    if (!orderId || !order?.deliveries) return
    try {
      await updateDeliveryStatus(deliveryId, !currentDelivered)
      const updated = await fetchOrderDetail(Number(orderId))
      setOrder(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update delivery')
    }
  }

  if (loading) return <Skeleton variant="rectangular" height={400} />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!order) return null

  return (
    <Box>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5">Order #{order.orderId}</Typography>
          {!order.isConfirmed && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? 'Confirming...' : 'Confirm Order'}
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`Confirmed: ${order.isConfirmed ? 'Yes' : 'No'}`} color={order.isConfirmed ? 'success' : 'warning'} />
          <Chip label={`Payment: ${order.paymentStatus}`} color={statusColor[order.paymentStatus ?? ''] || 'default'} />
          <Chip label={`Shipment: ${order.shipmentStatus}`} color={statusColor[order.shipmentStatus ?? ''] || 'default'} />
        </Box>
        <Typography variant="body2" color="text.secondary">
            Created: {order.createdAt ? new Date(order.createdAt).toLocaleString(undefined, { hour12: false }) : '-'}
        </Typography>
        <Typography variant="body2">
          User ID: {order.userId}
        </Typography>
        <Typography variant="body2">
          Total: {order.totalQuantity} items for {order.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </Typography>
      </Paper>

      {order.reservations && order.reservations.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Reservations</Typography>
          {order.reservations.map((r, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Slot {i + 1}: {new Date(r.startTime).toLocaleString(undefined, { hour12: false })} - {new Date(r.endTime).toLocaleString(undefined, { hour12: false })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={r.picked ? 'Picked' : 'Not Picked'}
                    color={r.picked ? 'success' : 'warning'}
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleUpdateReservationStatus(r.id, r.picked)}
                  >
                    {r.picked ? 'Mark as Not Picked' : 'Mark as Picked'}
                  </Button>
                </Box>
              </Box>
              {r.products && r.products.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {r.products.map((p, j) => (
                        <TableRow key={j}>
                          <TableCell>{p.productName}</TableCell>
                          <TableCell align="right">{p.quantity}</TableCell>
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
          <Typography variant="h6" gutterBottom>Deliveries</Typography>
          {order.deliveries.map((d, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Delivery {i + 1}: {new Date(d.deliveryTime).toLocaleString(undefined, { hour12: false })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={d.delivered ? 'Delivered' : 'Not Delivered'}
                    color={d.delivered ? 'success' : 'warning'}
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleUpdateDeliveryStatus(d.id, d.delivered)}
                  >
                    {d.delivered ? 'Mark as Not Delivered' : 'Mark as Delivered'}
                  </Button>
                </Box>
              </Box>
              {d.products && d.products.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {d.products.map((p, j) => (
                        <TableRow key={j}>
                          <TableCell>{p.productName}</TableCell>
                          <TableCell align="right">{p.quantity}</TableCell>
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
