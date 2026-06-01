import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, Link, Paper, TextField, Typography } from '@mui/material';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/dist/style.css';
import { fetchReservations } from '../api/admin';
import type { ReservationItem } from '../api/admin';
import type { OnTimeChange } from 'react-calendar-timeline';

interface CalendarGroup {
  id: number;
  title: string;
}

interface CalendarItem {
  id: number;
  group: number;
  title: string;
  start_time: number;
  end_time: number;
  itemProps?: {
    style?: React.CSSProperties;
  };
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function dateToTime(dateStr: string, bound: 'start' | 'end'): number {
  return new Date(`${dateStr}T${bound === 'start' ? '00:00' : '23:59'}`).getTime();
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const load = useCallback(async () => {
    try {
      setReservations(await fetchReservations(minDate || undefined, maxDate || undefined));
    } catch {
      /* ignore */
    }
  }, [minDate, maxDate]);

  useEffect(() => {
    load();
  }, [load]);

  const bounds = useMemo(() => {
    const hasMin = !!minDate;
    const hasMax = !!maxDate;
    return {
      min: hasMin ? dateToTime(minDate, 'start') : null,
      max: hasMax ? dateToTime(maxDate, 'end') : null,
      active: hasMin || hasMax,
    };
  }, [minDate, maxDate]);

  const [visibleTimeStart, setVisibleTimeStart] = useState(Date.now() - 7 * 86400000);
  const [visibleTimeEnd, setVisibleTimeEnd] = useState(Date.now() + 30 * 86400000);

  useEffect(() => {
    if (bounds.active) {
      const start = bounds.min ?? Date.now() - 7 * 86400000;
      const end = bounds.max ?? Date.now() + 30 * 86400000;
      setVisibleTimeStart(start);
      setVisibleTimeEnd(end);
    } else {
      setVisibleTimeStart(Date.now() - 7 * 86400000);
      setVisibleTimeEnd(Date.now() + 30 * 86400000);
    }
  }, [bounds.active, bounds.min, bounds.max]);

  const handleTimeChange: OnTimeChange<CalendarItem, CalendarGroup> = useCallback(
    (start, end, updateScrollCanvas) => {
      let clampedStart = start;
      let clampedEnd = end;
      if (bounds.min !== null && clampedStart < bounds.min) clampedStart = bounds.min;
      if (bounds.max !== null && clampedEnd > bounds.max) clampedEnd = bounds.max;
      if (clampedStart !== start || clampedEnd !== end) {
        updateScrollCanvas(clampedStart, clampedEnd);
      }
      setVisibleTimeStart(clampedStart);
      setVisibleTimeEnd(clampedEnd);
    },
    [bounds]
  );

  const { groups, buyerIdToGroupId } = useMemo(() => {
    const buyerKeys = new Map<string, string>();
    for (const r of reservations) {
      const key = r.userBuyerId ?? '__unknown__';
      if (!buyerKeys.has(key)) {
        buyerKeys.set(key, r.userBuyerName ?? r.userBuyerId ?? 'Unknown');
      }
    }
    const sortedKeys = Array.from(buyerKeys.keys()).sort();
    const g = sortedKeys.map((key, i) => ({ id: i, title: buyerKeys.get(key)! }));
    const map = new Map<string, number>();
    sortedKeys.forEach((key, i) => map.set(key, i));
    return { groups: g, buyerIdToGroupId: map };
  }, [reservations]);

  const items: CalendarItem[] = useMemo(() =>
    reservations.map(r => {
      const key = r.userBuyerId ?? '__unknown__';
      const groupId = buyerIdToGroupId.get(key) ?? 0;
      const start = new Date(`${r.day}T${r.startTime}`).getTime();
      const end = new Date(`${r.day}T${r.endTime}`).getTime();
      return {
        id: r.id,
        group: groupId,
        title: '',
        start_time: start,
        end_time: end,
        itemProps: {
          style: {
            background: r.isConfirmed ? '#4caf50' : '#ff9800',
            color: '#fff',
            borderRadius: '4px',
            border: r.picked ? '2px solid #1976d2' : undefined,
          },
        },
      };
    }),
    [reservations, buyerIdToGroupId]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Calendar</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Min Date"
          type="date"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={minDate}
          onChange={(e) => setMinDate(e.target.value)}
        />
        <TextField
          label="Max Date"
          type="date"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={maxDate}
          onChange={(e) => setMaxDate(e.target.value)}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', minHeight: 56 }}>
          {selectedReservation ? (
            <>
              <Typography variant="body1">
                Order <Link component="button" variant="body1" onClick={() => navigate(`/orders/${selectedReservation.orderId}`)} underline="hover">#{selectedReservation.orderId}</Link>
                {' | '}{selectedReservation.day} {formatTime(selectedReservation.startTime)}-{formatTime(selectedReservation.endTime)}
              </Typography>
              <Chip size="small" label={selectedReservation.isConfirmed ? 'Confirmed' : 'Unconfirmed'} color={selectedReservation.isConfirmed ? 'success' : 'warning'} />
              <Chip size="small" label={selectedReservation.picked ? 'Picked' : 'Not picked'} color={selectedReservation.picked ? 'info' : 'default'} />
              <Typography variant="body2" color="text.secondary">{selectedReservation.userBuyerName}</Typography>
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">Select a reservation to view its details</Typography>
          )}
        </Paper>
      </Box>
      <Timeline
        groups={groups}
        items={items}
        keys={{
          groupIdKey: 'id',
          groupTitleKey: 'title',
          groupLabelKey: 'title',
          groupRightTitleKey: 'title',
          itemIdKey: 'id',
          itemTitleKey: 'title',
          itemDivTitleKey: 'title',
          itemGroupKey: 'group',
          itemTimeStartKey: 'start_time',
          itemTimeEndKey: 'end_time',
        }}
        visibleTimeStart={visibleTimeStart}
        visibleTimeEnd={visibleTimeEnd}
        onTimeChange={handleTimeChange}
        onItemSelect={(itemId) => {
          const r = reservations.find(x => x.id === itemId);
          if (r) setSelectedReservation(r);
        }}
        onItemDeselect={() => setSelectedReservation(null)}
        onItemDoubleClick={(itemId) => {
          const r = reservations.find(x => x.id === itemId);
          if (r) navigate(`/orders/${r.orderId}`);
        }}
        sidebarWidth={200}
        lineHeight={60}
        itemHeightRatio={0.7}
        stackItems
        canMove={false}
        canChangeGroup={false}
        canResize={false}
        timeSteps={{
          second: 0,
          minute: 15,
          hour: 1,
          day: 1,
          month: 1,
          year: 1,
        }}
      />
    </Box>
  );
}
