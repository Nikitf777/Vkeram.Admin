import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Collapse,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Delete as DeleteIcon } from '@mui/icons-material';
import {
  fetchDefaultWorkingHours,
  updateDefaultWorkingHours,
  fetchMinimumBookingDays,
  updateMinimumBookingDays,
  fetchMinimumDeliveryDays,
  updateMinimumDeliveryDays,
  fetchMaximumBookingDays,
  updateMaximumBookingDays,
  fetchMaximumDeliveryDays,
  updateMaximumDeliveryDays,
  fetchAllowBooking,
  updateAllowBooking,
  fetchAllowDelivery,
  updateAllowDelivery,
  fetchHideProductsWithoutPrice,
  updateHideProductsWithoutPrice,
  fetchReservationDuration,
  updateReservationDuration,
  fetchBreaks,
  createBreak,
  updateBreak,
  deleteBreak,
  fetchOrderLimits,
  updateOrderLimits,
  fetchAutoConfirmOrders,
  updateAutoConfirmOrders,
} from '../api/admin';
import type { DefaultWorkingHoursData, DaysSettings, BreakData, OrderLimitsData, AutoConfirmOrdersData } from '../api/admin';

interface SettingsItem<T> {
  name: string;
  original: T;
  current: T;
  changed: boolean;
  saving: boolean;
}

function useSettingsItem<T>(fetcher: () => Promise<T>, initial: T) {
  const [item, setItem] = useState<SettingsItem<T>>({ name: '', original: initial, current: initial, changed: false, saving: false });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetcher();
      setItem((prev) => ({ ...prev, original: data, current: data, changed: false }));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => { load(); }, [load]);

  return { item, setItem, loading, reload: load };
}

function DefaultWorkingHoursCard() {
  const fetcher = useCallback(async () => {
    const data = await fetchDefaultWorkingHours();
    return { startTime: data.startTime, endTime: data.endTime };
  }, []);

  const { item, setItem, loading } = useSettingsItem(fetcher, { startTime: '', endTime: '' });

  if (loading) return <CircularProgress size={24} />;

  const setCurrent = (v: DefaultWorkingHoursData) => {
    setItem((prev) => ({
      ...prev,
      current: v,
      changed: v.startTime !== prev.original.startTime || v.endTime !== prev.original.endTime,
    }));
  };

  const handleSave = async () => {
    setItem((prev) => ({ ...prev, saving: true }));
    try {
      await updateDefaultWorkingHours(item.current);
      setItem((prev) => ({ ...prev, original: { ...prev.current }, changed: false }));
    } catch {
      /* ignore */
    } finally {
      setItem((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    setItem((prev) => ({ ...prev, current: { ...prev.original }, changed: false }));
  };

  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ minWidth: 200, fontWeight: 500 }}>Default Working Hours</Typography>
        <TimeField
          label="Start"
          value={item.current.startTime}
          onChange={(v) => setCurrent({ ...item.current, startTime: v })}
        />
        <TimeField
          label="End"
          value={item.current.endTime}
          onChange={(v) => setCurrent({ ...item.current, endTime: v })}
        />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={handleCancel} disabled={!item.changed || item.saving}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={handleSave} disabled={!item.changed || item.saving}>
            {item.saving ? 'Saving…' : 'Confirm'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function BreaksCard() {
  const [breaks, setBreaks] = useState<BreakData[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newStart, setNewStart] = useState('12:00');
  const [newEnd, setNewEnd] = useState('13:00');
  const [editId, setEditId] = useState<number | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');
  const [whStart, setWhStart] = useState('');
  const [whEnd, setWhEnd] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, wh] = await Promise.all([fetchBreaks(), fetchDefaultWorkingHours()]);
      setBreaks(data);
      setWhStart(wh.startTime);
      setWhEnd(wh.endTime);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const validateBreak = (start: string, end: string, skipId?: number): string => {
    if (!start || !end) return 'Both start and end times are required.';
    if (start >= end) return 'Start time must be before end time.';
    if (whStart && start <= whStart) return 'Break start must not be earlier than working hours start.';
    if (whEnd && end >= whEnd) return 'Break end must not be later than working hours end.';
    for (const b of breaks) {
      if (b.id === skipId) continue;
      if (start < b.endTime && end > b.startTime) return 'Break overlaps with an existing break.';
      if (end === b.startTime || start === b.endTime) return 'Breaks must not be directly adjacent to each other.';
    }
    return '';
  };

  const handleAdd = async () => {
    const err = validateBreak(newStart, newEnd);
    if (err) { setAddError(err); return; }
    setAddError('');
    try {
      await createBreak({ startTime: newStart, endTime: newEnd });
      await load();
      setNewStart('12:00');
      setNewEnd('13:00');
    } catch { /* ignore */ }
  };

  const handleSaveEdit = async (id: number) => {
    const err = validateBreak(editStart, editEnd, id);
    if (err) { setEditError(err); return; }
    setEditError('');
    try {
      await updateBreak(id, { startTime: editStart, endTime: editEnd });
      setEditId(null);
      await load();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBreak(id);
      await load();
    } catch { /* ignore */ }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 500 }}>Breaks</Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>
        <Collapse in={open}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TimeField label="Start" value={newStart} onChange={(v) => { setNewStart(v); setAddError(''); }} error={!!addError} />
            <TimeField label="End" value={newEnd} onChange={(v) => { setNewEnd(v); setAddError(''); }} error={!!addError} />
            <Button size="small" variant="contained" onClick={handleAdd} disabled={!!validateBreak(newStart, newEnd)}>Add</Button>
          </Box>
          {addError && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{addError}</Typography>}
          {breaks.length > 0 && (
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Start</TableCell>
                    <TableCell>End</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {breaks.map((b) => (
                    <TableRow key={b.id}>
                      {editId === b.id ? (
                        <>
                          <TableCell>
                            <TimeField value={editStart} onChange={(v) => { setEditStart(v); setEditError(''); }} error={!!editError} />
                          </TableCell>
                          <TableCell>
                            <TimeField value={editEnd} onChange={(v) => { setEditEnd(v); setEditError(''); }} error={!!editError} />
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => handleSaveEdit(b.id)} disabled={!!validateBreak(editStart, editEnd, b.id)}>Save</Button>
                            <Button size="small" onClick={() => setEditId(null)}>Cancel</Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{b.startTime}</TableCell>
                          <TableCell>{b.endTime}</TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => { setEditId(b.id); setEditStart(b.startTime); setEditEnd(b.endTime); setEditError(''); }}>Edit</Button>
                            <IconButton size="small" color="error" onClick={() => handleDelete(b.id)}><DeleteIcon fontSize="small" /></IconButton>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {editError && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{editError}</Typography>}
        </Collapse>
      </CardContent>
    </Card>
  );
}

function DaysCard({ title, fetcher, updater }: { title: string; fetcher: () => Promise<DaysSettings>; updater: (s: DaysSettings) => Promise<void> }) {
  const { item, setItem, loading } = useSettingsItem(fetcher, { days: 1, countWorkingDaysOnly: false });

  if (loading) return <CircularProgress size={24} />;

  const setCurrent = (v: DaysSettings) => {
    setItem((prev) => ({
      ...prev,
      current: v,
      changed: v.days !== prev.original.days || v.countWorkingDaysOnly !== prev.original.countWorkingDaysOnly,
    }));
  };

  const handleSave = async () => {
    setItem((prev) => ({ ...prev, saving: true }));
    try {
      await updater(item.current);
      setItem((prev) => ({ ...prev, original: { ...prev.current }, changed: false }));
    } catch {
      /* ignore */
    } finally {
      setItem((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    setItem((prev) => ({ ...prev, current: { ...prev.original }, changed: false }));
  };

  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ minWidth: 200, fontWeight: 500 }}>{title}</Typography>
        <TextField
          size="small"
          label="Days"
          type="number"
          value={item.current.days}
          onChange={(e) => setCurrent({ ...item.current, days: Math.max(1, parseInt(e.target.value) || 1) })}
          slotProps={{ htmlInput: { min: 1, max: 365 } }}
          sx={{ width: 100 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={item.current.countWorkingDaysOnly}
              onChange={(e) => setCurrent({ ...item.current, countWorkingDaysOnly: e.target.checked })}
            />
          }
          label="Working days only"
        />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={handleCancel} disabled={!item.changed || item.saving}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={handleSave} disabled={!item.changed || item.saving}>
            {item.saving ? 'Saving…' : 'Confirm'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function TimeField({ value, onChange, label, size, sx, error }: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  size?: 'small' | 'medium';
  sx?: Record<string, unknown>;
  error?: boolean;
}) {
  const parts = value.split(':');
  const hour = parts[0] || '00';
  const minute = parts[1] || '00';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ...sx }}>
      {label && <Typography variant="caption" sx={{ mr: 0.5, color: error ? 'error.main' : undefined }}>{label}</Typography>}
      <Select size={size || 'small'} value={hour} onChange={(e) => onChange(`${e.target.value}:${minute}`)} sx={{ width: 70 }}>
        {HOURS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
      </Select>
      <Typography>:</Typography>
      <Select size={size || 'small'} value={minute} onChange={(e) => onChange(`${hour}:${e.target.value}`)} sx={{ width: 70 }}>
        {MINUTES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
      </Select>
    </Box>
  );
}

function AllowCard({ title, fetcher, updater, enabledLabel = 'Allowed', disabledLabel = 'Not allowed' }: { title: string; fetcher: () => Promise<boolean>; updater: (v: boolean) => Promise<void>; enabledLabel?: string; disabledLabel?: string }) {
  const [original, setOriginal] = useState(true);
  const [current, setCurrent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const changed = current !== original;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const v = await fetcher();
        setOriginal(v);
        setCurrent(v);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updater(current);
      setOriginal(current);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ minWidth: 200, fontWeight: 500 }}>{title}</Typography>
        <FormControlLabel
          control={<Switch checked={current} onChange={(e) => setCurrent(e.target.checked)} />}
          label={current ? enabledLabel : disabledLabel}
        />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setCurrent(original)} disabled={!changed || saving}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={handleSave} disabled={!changed || saving}>
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function DurationCard({ title, fetcher, updater }: { title: string; fetcher: () => Promise<number>; updater: (v: number) => Promise<void> }) {
  const [original, setOriginal] = useState(30);
  const [current, setCurrent] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const changed = current !== original;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const v = await fetcher();
        setOriginal(v);
        setCurrent(v);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updater(current);
      setOriginal(current);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ minWidth: 200, fontWeight: 500 }}>{title}</Typography>
        <TextField
          size="small"
          label="Minutes"
          type="number"
          value={current}
          onChange={(e) => setCurrent(Math.max(1, Math.min(480, parseInt(e.target.value) || 1)))}
          slotProps={{ htmlInput: { min: 1, max: 480 } }}
          sx={{ width: 100 }}
        />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setCurrent(original)} disabled={!changed || saving}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={handleSave} disabled={!changed || saving}>
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function OrderLimitsCard() {
  const [original, setOriginal] = useState<OrderLimitsData>({
    minOrderPrice: 0,
    maxOrderPrice: 1000000,
    minOrderQuantity: 1,
    maxOrderQuantity: 10000,
    minReservationQuantity: 1,
    maxReservationQuantity: 100,
    minDeliveryQuantity: 1,
    maxDeliveryQuantity: 100,
    minProductReservationQuantity: 1,
    maxProductReservationQuantity: 1000,
  });
  const [current, setCurrent] = useState<OrderLimitsData>(original);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchOrderLimits();
        const { id: _, ...limits } = data;
        setOriginal(limits);
        setCurrent(limits);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const changed = JSON.stringify(current) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOrderLimits(current);
      setOriginal(current);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrent(original);
  };

  const updateField = <K extends keyof OrderLimitsData>(field: K, value: OrderLimitsData[K]) => {
    setCurrent((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 500 }}>Order Limits</Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>
        <Collapse in={open}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Order Price</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField size="small" label="Min Price" type="number" value={current.minOrderPrice} onChange={(e) => updateField('minOrderPrice', parseFloat(e.target.value) || 0)} sx={{ width: 140 }} />
              <TextField size="small" label="Max Price" type="number" value={current.maxOrderPrice} onChange={(e) => updateField('maxOrderPrice', parseFloat(e.target.value) || 0)} sx={{ width: 140 }} />
            </Box>

            <Typography variant="subtitle2" color="text.secondary">Order Quantity</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField size="small" label="Min Quantity" type="number" value={current.minOrderQuantity} onChange={(e) => updateField('minOrderQuantity', parseInt(e.target.value) || 0)} sx={{ width: 140 }} />
              <TextField size="small" label="Max Quantity" type="number" value={current.maxOrderQuantity} onChange={(e) => updateField('maxOrderQuantity', parseInt(e.target.value) || 0)} sx={{ width: 140 }} />
            </Box>

            <Typography variant="subtitle2" color="text.secondary">Reservation Quantity</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField size="small" label="Min Quantity" type="number" value={current.minReservationQuantity} onChange={(e) => updateField('minReservationQuantity', parseInt(e.target.value) || 0)} sx={{ width: 140 }} />
              <TextField size="small" label="Max Quantity" type="number" value={current.maxReservationQuantity} onChange={(e) => updateField('maxReservationQuantity', parseInt(e.target.value) || 0)} sx={{ width: 140 }} />
            </Box>

            <Typography variant="subtitle2" color="text.secondary">Delivery Quantity</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField size="small" label="Min Quantity" type="number" value={current.minDeliveryQuantity} onChange={(e) => updateField('minDeliveryQuantity', parseInt(e.target.value) || 0)} sx={{ width: 140 }} />
              <TextField size="small" label="Max Quantity" type="number" value={current.maxDeliveryQuantity} onChange={(e) => updateField('maxDeliveryQuantity', parseInt(e.target.value) || 0)} sx={{ width: 140 }} />
            </Box>

            <Typography variant="subtitle2" color="text.secondary">Product Reservation Quantity</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField size="small" label="Min Quantity" type="number" value={current.minProductReservationQuantity} onChange={(e) => updateField('minProductReservationQuantity', parseInt(e.target.value) || 0)} sx={{ width: 140 }} />
              <TextField size="small" label="Max Quantity" type="number" value={current.maxProductReservationQuantity} onChange={(e) => updateField('maxProductReservationQuantity', parseInt(e.target.value) || 0)} sx={{ width: 140 }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button size="small" variant="outlined" onClick={handleCancel} disabled={!changed || saving}>
                Cancel
              </Button>
              <Button size="small" variant="contained" onClick={handleSave} disabled={!changed || saving}>
                {saving ? 'Saving…' : 'Confirm'}
              </Button>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

function AutoConfirmOrdersCard() {
  const [original, setOriginal] = useState<AutoConfirmOrdersData>({
    isEnabled: false,
    maxAutoConfirmPrice: 10000,
    maxAutoConfirmQuantity: 100,
  });
  const [current, setCurrent] = useState<AutoConfirmOrdersData>(original);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAutoConfirmOrders();
        const { id: _, ...settings } = data;
        setOriginal(settings);
        setCurrent(settings);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const changed = JSON.stringify(current) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAutoConfirmOrders(current);
      setOriginal(current);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrent(original);
  };

  const updateField = <K extends keyof AutoConfirmOrdersData>(field: K, value: AutoConfirmOrdersData[K]) => {
    setCurrent((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ fontWeight: 500 }}>Auto-Confirm Orders</Typography>

          <FormControlLabel
            control={
              <Switch
                checked={current.isEnabled}
                onChange={(e) => updateField('isEnabled', e.target.checked)}
              />
            }
            label={current.isEnabled ? 'Enabled' : 'Disabled'}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Max Price"
              type="number"
              value={current.maxAutoConfirmPrice}
              onChange={(e) => updateField('maxAutoConfirmPrice', parseFloat(e.target.value) || 0)}
              sx={{ width: 140 }}
            />
            <TextField
              size="small"
              label="Max Quantity"
              type="number"
              value={current.maxAutoConfirmQuantity}
              onChange={(e) => updateField('maxAutoConfirmQuantity', parseInt(e.target.value) || 0)}
              sx={{ width: 140 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button size="small" variant="outlined" onClick={handleCancel} disabled={!changed || saving}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleSave} disabled={!changed || saving}>
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Settings</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DefaultWorkingHoursCard />
        <BreaksCard />

        <AllowCard
          title="Allow Booking"
          fetcher={useCallback(async () => { const d = await fetchAllowBooking(); return d.isAllowed; }, [])}
          updater={useCallback(async (v: boolean) => { await updateAllowBooking(v); }, [])}
        />

        <AllowCard
          title="Allow Delivery"
          fetcher={useCallback(async () => { const d = await fetchAllowDelivery(); return d.isAllowed; }, [])}
          updater={useCallback(async (v: boolean) => { await updateAllowDelivery(v); }, [])}
        />

        <AllowCard
          title="Hide Products Without Price"
          fetcher={useCallback(async () => { const d = await fetchHideProductsWithoutPrice(); return d.isEnabled; }, [])}
          updater={useCallback(async (v: boolean) => { await updateHideProductsWithoutPrice(v); }, [])}
          enabledLabel="Hidden"
          disabledLabel="Not hidden"
        />

        <DurationCard
          title="Reservation Duration"
          fetcher={useCallback(async () => { const d = await fetchReservationDuration(); return d.durationMinutes; }, [])}
          updater={useCallback(async (v: number) => { await updateReservationDuration(v); }, [])}
        />

        <DaysCard
          title="Minimum Booking Days"
          fetcher={useCallback(async () => {
            const d = await fetchMinimumBookingDays();
            return { days: d.days, countWorkingDaysOnly: d.countWorkingDaysOnly };
          }, [])}
          updater={useCallback(async (s: DaysSettings) => { await updateMinimumBookingDays(s); }, [])}
        />

        <DaysCard
          title="Minimum Delivery Days"
          fetcher={useCallback(async () => {
            const d = await fetchMinimumDeliveryDays();
            return { days: d.days, countWorkingDaysOnly: d.countWorkingDaysOnly };
          }, [])}
          updater={useCallback(async (s: DaysSettings) => { await updateMinimumDeliveryDays(s); }, [])}
        />

        <DaysCard
          title="Maximum Booking Days"
          fetcher={useCallback(async () => {
            const d = await fetchMaximumBookingDays();
            return { days: d.days, countWorkingDaysOnly: d.countWorkingDaysOnly };
          }, [])}
          updater={useCallback(async (s: DaysSettings) => { await updateMaximumBookingDays(s); }, [])}
        />

        <DaysCard
          title="Maximum Delivery Days"
          fetcher={useCallback(async () => {
            const d = await fetchMaximumDeliveryDays();
            return { days: d.days, countWorkingDaysOnly: d.countWorkingDaysOnly };
          }, [])}
          updater={useCallback(async (s: DaysSettings) => { await updateMaximumDeliveryDays(s); }, [])}
        />

        <OrderLimitsCard />

        <AutoConfirmOrdersCard />
      </Box>
    </Box>
  );
}
