import { MessageSquare, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { MessagingStat } from '../components/messaging/MessagingStatCard';
import { deltaLabel } from './format';
import type { SmsStats } from './types';

/** Four headline SMS figures for the period, with honest deltas. */
export function smsStatCards(stats: SmsStats | null): MessagingStat[] {
  const c = stats?.current;
  const p = stats?.previous;
  const period = `vs. previous ${stats?.days ?? 30} days`;
  const pct = (n: number, d: number) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '—');
  const d = (cur: number, prev: number, upIsGood: boolean) => {
    const l = deltaLabel(cur, prev);
    return l ? { text: l.text, good: l.up === upIsGood } : null;
  };

  return [
    {
      label: 'Messages Sent',
      value: (c?.messages ?? 0).toLocaleString(),
      delta: c && p ? d(c.messages, p.messages, true) : null,
      footnote: p && p.messages > 0 ? period : `Last ${stats?.days ?? 30} days`,
      icon: MessageSquare,
      iconBg: 'bg-blue-500',
    },
    {
      label: 'Units Used',
      value: (c?.unitsUsed ?? 0).toLocaleString(),
      delta: c && p ? d(c.unitsUsed, p.unitsUsed, true) : null,
      footnote: p && p.unitsUsed > 0 ? period : `Last ${stats?.days ?? 30} days`,
      icon: Package,
      iconBg: 'bg-teal-600',
    },
    {
      label: 'Accepted',
      value: (c?.submitted ?? 0).toLocaleString(),
      footnote: c ? `${pct(c.submitted, c.messages)} of messages · ${c.delivered.toLocaleString()} delivery-confirmed` : '—',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'Failed',
      value: (c?.failed ?? 0).toLocaleString(),
      delta: c && p ? d(c.failed, p.failed, false) : null,
      footnote: c ? `${pct(c.failed, c.messages)} failure rate` : '—',
      icon: AlertTriangle,
      iconBg: 'bg-rose-500',
    },
  ];
}
