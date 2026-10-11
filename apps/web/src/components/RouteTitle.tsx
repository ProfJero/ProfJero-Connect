import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES: Array<[RegExp, string]> = [
  [/^\/login/, 'Sign in'],
  [/^\/forgot-password/, 'Reset password'],
  [/^\/dashboard/, 'Dashboard'],
  [/^\/projects\/[^/]+/, 'Project'],
  [/^\/projects/, 'Projects / Clients'],
  [/^\/sender-ids/, 'Sender IDs'],
  [/^\/pricing/, 'Pricing'],
  [/^\/sms-logs/, 'SMS Logs'],
  [/^\/send-sms/, 'Send SMS'],
  [/^\/wallets/, 'Wallets & Units'],
  [/^\/payments/, 'Payments'],
  [/^\/providers/, 'Providers'],
  [/^\/reports/, 'Reports'],
  [/^\/monitoring/, 'Monitoring'],
  [/^\/settings/, 'Settings'],
];

/** Sets the browser tab title for the current page. */
export function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = TITLES.find(([re]) => re.test(pathname))?.[1];
    document.title = page ? `${page} · ProfJero Connect Admin` : 'ProfJero Connect Admin';
  }, [pathname]);
  return null;
}
