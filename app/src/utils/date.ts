import { Platform } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

/** "7 Feb" */
export function formatDateShort(input: string | number | Date): string {
  const d = new Date(input);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Mon 7 Feb, 14:05" */
export function formatDateTime(input: string | number | Date): string {
  const d = new Date(input);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "14:05", or "Tomorrow 14:05" / "Mon 7 Feb, 14:05" when not today. */
export function formatRelativeTime(input: number): string {
  const d = new Date(input);
  const now = new Date();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return `Today ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return formatDateTime(d);
}

/** Seconds → "HH:MM:SS" (hours may exceed 24). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** Seconds → "3h 12m" / "45m". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Local calendar day key "YYYY-MM-DD" (not UTC). */
export function localDayKey(input: string | number | Date): string {
  const d = new Date(input);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Opens the native Android date picker, then the time picker when `withTime` is set.
 * Resolves with the chosen Date, or null if the user dismissed either dialog.
 */
export function pickDateTime(options: {
  value: Date;
  withTime?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}): Promise<Date | null> {
  if (Platform.OS !== 'android') return Promise.resolve(null);
  const { value, withTime, maximumDate, minimumDate } = options;
  return new Promise((resolve) => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      maximumDate,
      minimumDate,
      onChange: (event, date) => {
        if (event.type !== 'set' || !date) return resolve(null);
        const picked = new Date(date);
        if (!withTime) return resolve(picked);
        DateTimePickerAndroid.open({
          value: picked,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== 'set' || !time) return resolve(null);
            picked.setHours(time.getHours(), time.getMinutes(), 0, 0);
            resolve(picked);
          },
        });
      },
    });
  });
}
