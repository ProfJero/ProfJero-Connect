import { PaymentMetricCard } from '../../components/payments/PaymentMetricCard';
import { PaymentsTable } from '../../components/payments/PaymentsTable';
import { PaymentDetailsInspector } from '../../components/payments/PaymentDetailsInspector';
import { paymentMetrics } from '../../mock/payments';

export function PaymentsPage() {
  return (
    <main className="p-7 space-y-6 flex-1">
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {paymentMetrics.map((m) => (
          <PaymentMetricCard key={m.label} metric={m} />
        ))}
      </section>

      <section className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 w-full min-w-0">
          <PaymentsTable />
        </div>
        <PaymentDetailsInspector />
      </section>
    </main>
  );
}