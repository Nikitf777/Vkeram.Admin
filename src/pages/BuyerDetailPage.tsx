import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchBuyerDetail } from '../api/admin';

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export default function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

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

  const entries = Object.entries(buyer);

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/buyers')} sx={{ mb: 2 }}>
        Back to Buyers
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>Buyer Details</Typography>

      <Card>
        <CardContent>
          <Table size="small">
            <TableBody>
              {entries.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell sx={{ fontWeight: 600, width: '30%', verticalAlign: 'top' }}>{key}</TableCell>
                  <TableCell sx={{ whiteSpace: 'pre-wrap', fontFamily: typeof value === 'object' && value !== null ? 'monospace' : 'inherit' }}>
                    {renderValue(value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
