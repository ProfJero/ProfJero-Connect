import { useParams } from 'react-router-dom';
import { ProjectHeaderCard } from '../../components/projects/ProjectHeaderCard';
import { ProjectMetricCard } from '../../components/projects/ProjectMetricCard';
import { ProjectUsageCard } from '../../components/projects/ProjectUsageCard';
import { ProjectApiCard } from '../../components/projects/ProjectApiCard';
import { ProjectSenderIdCard } from '../../components/projects/ProjectSenderIdCard';
import { ProjectSmsActivityCard } from '../../components/projects/ProjectSmsActivityCard';
import { ProjectWalletCard } from '../../components/projects/ProjectWalletCard';
import { ProjectLimitsCard } from '../../components/projects/ProjectLimitsCard';
import { ProjectEventsCard } from '../../components/projects/ProjectEventsCard';
import { ProjectQuickActionsCard } from '../../components/projects/ProjectQuickActionsCard';
import { detailMetrics } from '../../mock/projectDetails';

export function ProjectDetailsPage() {
  // useParams reserved for future use — mock currently shows GABS regardless of id
  const { id: _id } = useParams<{ id: string }>();

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      {/* Header card */}
      <ProjectHeaderCard />

      {/* 7 KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {detailMetrics.map((m) => (
          <ProjectMetricCard key={m.label} metric={m} />
        ))}
      </section>

      {/* Usage + API + Sender ID */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <ProjectUsageCard />
        <ProjectApiCard />
        <ProjectSenderIdCard />
      </section>

      {/* SMS Activity + Wallet + Limits */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <ProjectSmsActivityCard />
        <ProjectWalletCard />
        <ProjectLimitsCard />
      </section>

      {/* Project Events + Quick Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <ProjectEventsCard />
        <ProjectQuickActionsCard />
      </section>
    </main>
  );
}