import { Navigate, useLocation } from 'react-router-dom';
import { BuyDataPage } from '../../features/data/BuyDataPage';
import { useAuth } from '../../lib/auth';

/** The open shop; signed-in customers use the in-app shop so orders stay on their account. */
export function GuestShop() {
  const { isAuthenticated, isReady } = useAuth();
  const { search } = useLocation();
  if (isReady && isAuthenticated) return <Navigate to={`/services/data${search}`} replace />;
  return <BuyDataPage guest />;
}
