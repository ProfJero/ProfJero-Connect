import { Badge } from '../ui/Badge';
import { dataOrderStatus } from '../../lib/dataOrders';
import type { DataOrder } from '../../lib/types';

export function DataOrderBadge({ order }: { order: DataOrder }) {
  const s = dataOrderStatus(order);
  return <Badge tone={s.tone} label={s.label} />;
}
