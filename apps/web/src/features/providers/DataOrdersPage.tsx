import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export function DataOrdersPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1976d2] flex items-center justify-center text-white shadow-sm shrink-0">
            <ShoppingBag className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Data Orders
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer purchases across every project.
            </p>
          </div>
        </div>
        <Link
          to="/providers"
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          Providers
        </Link>
      </div>

      <Card className="p-12 text-center">
        <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No data orders yet
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Orders will appear here as soon as customers start buying data bundles.
          The purchase flow ships in the next batch.
        </p>
      </Card>
    </main>
  );
}