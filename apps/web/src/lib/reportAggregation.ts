import type { Payment, SmsBatch } from '@profjero/shared';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** ISO date string → "Sep 21" for chart labels. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const m = MONTHS_SHORT[d.getUTCMonth()];
  const day = d.getUTCDate();
  return `${m} ${day}`;
}

/** ISO date string → "YYYY-MM-DD" (UTC) for bucketing. */
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Monday of the week that contains the given ISO timestamp. */
function weekStartKey(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay(); // 0 = Sunday
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - daysFromMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

/** "Sep 15 – 21" label from a week-start ISO date. */
function weekLabel(weekStartIso: string): string {
  const start = new Date(weekStartIso + 'T00:00:00Z');
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const m = MONTHS_SHORT[start.getUTCMonth()];
  const mEnd = MONTHS_SHORT[end.getUTCMonth()];
  if (m === mEnd) {
    return `${m} ${start.getUTCDate()} – ${end.getUTCDate()}`;
  }
  return `${m} ${start.getUTCDate()} – ${mEnd} ${end.getUTCDate()}`;
}

// ---------- Period filtering ----------

export function filterByPeriod<T extends { createdAt: string }>(
  items: T[],
  days: number,
): T[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((i) => new Date(i.createdAt).getTime() >= cutoff);
}

/** Payments count as belonging to their paidAt if set, else createdAt. */
export function filterPaymentsByPeriod(
  payments: Payment[],
  days: number,
): Payment[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return payments.filter((p) => {
    const iso = p.paidAt ?? p.createdAt;
    return new Date(iso).getTime() >= cutoff;
  });
}

// ---------- Daily aggregation ----------

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  label: string; // "Sep 21"
  recipients: number;
  submitted: number;
  failed: number;
  units: number;
}

export function groupByDay(batches: SmsBatch[], days: number): DailyPoint[] {
  const buckets = new Map<string, DailyPoint>();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Pre-fill every day in the window with zeros so the chart is complete.
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: shortDate(key),
      recipients: 0,
      submitted: 0,
      failed: 0,
      units: 0,
    });
  }

  for (const b of batches) {
    const key = dayKey(b.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.recipients += b.totalRecipients;
    bucket.submitted += b.submittedCount;
    bucket.failed += b.failedCount;
    bucket.units += b.totalUnitsCharged;
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Weekly aggregation ----------

export interface WeeklyPoint {
  weekStart: string;
  label: string;
  recipients: number;
  units: number;
  revenuePesewas: number;
  payments: number;
}

export function groupByWeek(
  batches: SmsBatch[],
  payments: Payment[],
  weeks: number,
): WeeklyPoint[] {
  const buckets = new Map<string, WeeklyPoint>();
  const now = new Date();
  const thisMonday = new Date(now);
  const day = now.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  thisMonday.setUTCDate(now.getUTCDate() - daysFromMonday);
  thisMonday.setUTCHours(0, 0, 0, 0);

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setUTCDate(thisMonday.getUTCDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      weekStart: key,
      label: weekLabel(key),
      recipients: 0,
      units: 0,
      revenuePesewas: 0,
      payments: 0,
    });
  }

  for (const b of batches) {
    const key = weekStartKey(b.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.recipients += b.totalRecipients;
    bucket.units += b.totalUnitsCharged;
  }

  for (const p of payments) {
    const iso = p.paidAt ?? p.createdAt;
    const key = weekStartKey(iso);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (p.status === 'success') {
      bucket.revenuePesewas += p.amountPesewas;
      bucket.payments += 1;
    }
  }

  return [...buckets.values()].sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart),
  );
}

// ---------- Project stats ----------

export interface ProjectStat {
  projectId: string;
  projectName: string;
  recipients: number;
  units: number;
  failed: number;
  totalOutcomes: number;
  failureRate: number; // 0-1
  revenuePesewas: number;
}

export function computeProjectStats(
  batches: SmsBatch[],
  payments: Payment[],
  projectNames: Map<string, string>,
): ProjectStat[] {
  const stats = new Map<string, ProjectStat>();

  const ensure = (projectId: string): ProjectStat => {
    let s = stats.get(projectId);
    if (!s) {
      s = {
        projectId,
        projectName: projectNames.get(projectId) ?? '(unknown project)',
        recipients: 0,
        units: 0,
        failed: 0,
        totalOutcomes: 0,
        failureRate: 0,
        revenuePesewas: 0,
      };
      stats.set(projectId, s);
    }
    return s;
  };

  for (const b of batches) {
    const s = ensure(b.projectId);
    s.recipients += b.totalRecipients;
    s.units += b.totalUnitsCharged;
    s.failed += b.failedCount;
    s.totalOutcomes +=
      b.submittedCount + b.failedCount + b.unknownCount;
  }

  for (const p of payments) {
    if (p.status !== 'success') continue;
    const s = ensure(p.projectId);
    s.revenuePesewas += p.amountPesewas;
  }

  for (const s of stats.values()) {
    s.failureRate =
      s.totalOutcomes > 0 ? s.failed / s.totalOutcomes : 0;
  }

  return [...stats.values()].sort((a, b) => b.recipients - a.recipients);
}

// ---------- Donut ----------

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

const DONUT_COLORS = [
  '#2563eb',
  '#0d9488',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#64748b',
];

export function computeDonutSegments(
  projectStats: ProjectStat[],
  maxSegments = 5,
): { segments: DonutSegment[]; totalUnits: number } {
  const withUnits = projectStats.filter((s) => s.units > 0);
  const totalUnits = withUnits.reduce((sum, s) => sum + s.units, 0);

  if (totalUnits === 0) {
    return { segments: [], totalUnits: 0 };
  }

  const top = withUnits.slice(0, maxSegments);
  const restUnits = withUnits
    .slice(maxSegments)
    .reduce((sum, s) => sum + s.units, 0);

  const segments: DonutSegment[] = top.map((s, i) => ({
    name: s.projectName,
    value: Number(((s.units / totalUnits) * 100).toFixed(1)),
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  if (restUnits > 0) {
    segments.push({
      name: 'Others',
      value: Number(((restUnits / totalUnits) * 100).toFixed(1)),
      color: DONUT_COLORS[DONUT_COLORS.length - 1],
    });
  }

  return { segments, totalUnits };
}

// ---------- Formatting ----------

export function formatGhs(pesewas: number): string {
  return `GHS ${(pesewas / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}