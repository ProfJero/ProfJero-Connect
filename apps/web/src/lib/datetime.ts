const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const TIME_FMT = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/** Split an ISO timestamp into the two-line date/time format the table expects. */
export function splitDateTime(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) return { date: '—', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
  return { date: DATE_FMT.format(d), time: TIME_FMT.format(d) };
}