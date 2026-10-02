import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import type { SmsStats } from '../../lib/types';

/** Last 7 days of messages and units, from /customer/sms/stats. */
export function SmsUsageChart({ stats, loading }: { stats: SmsStats | null; loading: boolean }) {
  const data = (stats?.series ?? []).slice(-7).map((d) => ({
    day: new Date(`${d.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    messages: d.messages,
    units: d.units,
  }));
  const empty = data.every((d) => d.messages === 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
          SMS Usage <span className="font-normal text-slate-400 dark:text-slate-500 text-xs">(Last 7 Days)</span>
        </h3>
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a6cf0]" />
            <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Messages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Units charged</span>
          </div>
        </div>
      </div>

      <div className="mt-4 w-full h-[200px] relative">
        {loading && !stats ? (
          <div className="h-full rounded-lg bg-slate-50 dark:bg-slate-800/50 animate-pulse" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a6cf0" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#1a6cf0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="currentColor" className="text-slate-100 dark:text-slate-800" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toLocaleString()}
                  width={38}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, padding: 8, color: '#fff', fontSize: 11 }}
                  formatter={(v) => (typeof v === 'number' ? v.toLocaleString() : String(v ?? ''))}
                />
                <Area type="monotone" dataKey="messages" name="Messages" stroke="#1a6cf0" strokeWidth={2.5} fill="url(#chartGradient)" dot={{ r: 3.5, fill: '#1a6cf0', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="units" name="Units" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            {empty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg pointer-events-auto">
                  No messages this week.{' '}
                  <Link to="/messaging/sms" className="text-[#1a6cf0] dark:text-blue-400 font-semibold hover:underline">
                    Send one
                  </Link>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
