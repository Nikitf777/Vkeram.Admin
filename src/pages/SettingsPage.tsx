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
  fetchReservationDuration,
  updateReservationDuration,
  fetchBreaks,
  createBreak,
  updateBreak,
  deleteBreak,
} from '../api/admin';
import type { DefaultWorkingHoursData, DaysSettings, BreakData } from '../api/admin';

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
        <TextField
          size="small"
          label="Start"
          type="time"
          value={item.current.startTime}
          onChange={(e) => setCurrent({ ...item.current, startTime: e.target.value })}
          slotProps={{ htmlInput: { step: 60 } }}
          sx={{ width: 140 }}
        />
        <TextField
          size="small"
          label="End"
          type="time"
          value={item.current.endTime}
          onChange={(e) => setCurrent({ ...item.current, endTime: e.target.value })}
          slotProps={{ htmlInput: { step: 60 } }}
          sx={{ width: 140 }}
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

  const validateBreak = (start: string, end: string): string => {
    if (!start || !end) return 'Both start and end times are required.';
    if (start >= end) return 'Start time must be before end time.';
    if (whStart && start <= whStart) return 'Break start must not be earlier than working hours start.';
    if (whEnd && end >= whEnd) return 'Break end must not be later than working hours end.';
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
    const err = validateBreak(editStart, editEnd);
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
            <TextField size="small" label="Start" type="time" value={newStart} onChange={(e) => { setNewStart(e.target.value); setAddError(''); }} slotProps={{ htmlInput: { step: 60 } }} sx={{ width: 140 }} error={!!addError} />
            <TextField size="small" label="End" type="time" value={newEnd} onChange={(e) => { setNewEnd(e.target.value); setAddError(''); }} slotProps={{ htmlInput: { step: 60 } }} sx={{ width: 140 }} error={!!addError} />
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
                            <TextField size="small" type="time" value={editStart} onChange={(e) => { setEditStart(e.target.value); setEditError(''); }} slotProps={{ htmlInput: { step: 60 } }} sx={{ width: 120 }} error={!!editError} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="time" value={editEnd} onChange={(e) => { setEditEnd(e.target.value); setEditError(''); }} slotProps={{ htmlInput: { step: 60 } }} sx={{ width: 120 }} error={!!editError} />
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => handleSaveEdit(b.id)} disabled={!!validateBreak(editStart, editEnd)}>Save</Button>
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

function AllowCard({ title, fetcher, updater }: { title: string; fetcher: () => Promise<boolean>; updater: (v: boolean) => Promise<void> }) {
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
          label={current ? 'Allowed' : 'Not allowed'}
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
      </Box>
    </Box>
  );
}
