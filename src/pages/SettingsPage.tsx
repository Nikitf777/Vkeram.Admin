import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import {
  fetchWorkingHours,
  updateWorkingHours,
  fetchMinimumBookingDays,
  updateMinimumBookingDays,
  fetchMinimumDeliveryDays,
  updateMinimumDeliveryDays,
  fetchMaximumBookingDays,
  updateMaximumBookingDays,
  fetchMaximumDeliveryDays,
  updateMaximumDeliveryDays,
} from '../api/admin';
import type { WorkingHoursData, DaysSettings } from '../api/admin';

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

function WorkingHoursCard() {
  const fetcher = useCallback(async () => {
    const data = await fetchWorkingHours();
    return { startTime: data.startTime, endTime: data.endTime };
  }, []);

  const { item, setItem, loading } = useSettingsItem(fetcher, { startTime: '', endTime: '' });

  if (loading) return <CircularProgress size={24} />;

  const setCurrent = (v: WorkingHoursData) => {
    setItem((prev) => ({
      ...prev,
      current: v,
      changed: v.startTime !== prev.original.startTime || v.endTime !== prev.original.endTime,
    }));
  };

  const handleSave = async () => {
    setItem((prev) => ({ ...prev, saving: true }));
    try {
      await updateWorkingHours(item.current);
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
        <Typography sx={{ minWidth: 200, fontWeight: 500 }}>Working Hours</Typography>
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

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Settings</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <WorkingHoursCard />

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
