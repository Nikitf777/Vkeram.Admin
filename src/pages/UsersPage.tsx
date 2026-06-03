import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material';
import { fetchUsers } from '../api/admin';
import type { User } from '../api/admin';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);

  const load = useCallback(async () => {
    try {
      setUsers(await fetchUsers());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Зарегистрированные пользователи</Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Компания</TableCell>
              <TableCell>Контактное лицо</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Зарегистрирован</TableCell>
              <TableCell>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/users/${u.id}`)}>
                <TableCell>{u.id}</TableCell>
                <TableCell>
                  <Link component={RouterLink} to={`/buyers/${encodeURIComponent(u.buyerId)}`} underline="hover" onClick={(e) => e.stopPropagation()}>
                    {u.buyerName || u.buyerId}
                  </Link>
                </TableCell>
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
    </Box>
  );
}
