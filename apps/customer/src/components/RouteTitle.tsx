import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES: Array<[RegExp, string]> = [
  [/^\/login/, 'Sign in'],
  [/^\/signup/, 'Create your account'],
  [/^\/forgot-password/, 'Reset password'],
  [/^\/complete-setup/, 'Finish setting up'],
  [/^\/developers/, 'SMS API documentation'],
  [/^\/dashboard/, 'Dashboard'],
  [/^\/messaging\/sms/, 'Send SMS'],
  [/^\/messaging\/history\/[^/]+/, 'Message details'],
  [/^\/messaging\/history/, 'Message history'],
  [/^\/messaging\/sender-ids\/request/, 'Request a Sender ID'],
  [/^\/messaging\/sender-ids/, 'Sender IDs'],
  [/^\/messaging\/campaigns/, 'Campaigns'],
  [/^\/messaging\/templates/, 'Message templates'],
  [/^\/messaging/, 'Messaging'],
  [/^\/contacts\/groups/, 'Contact groups'],
  [/^\/contacts/, 'Contacts'],
  [/^\/services/, 'Services'],
  [/^\/wallet\/add-funds/, 'Add funds'],
  [/^\/wallet/, 'Wallet'],
  [/^\/transactions/, 'Transactions'],
  [/^\/api/, 'API & Integrations'],
  [/^\/notifications/, 'Notifications'],
  [/^\/settings/, 'Settings'],
];

/** Sets the browser tab title for the current page. */
export function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = TITLES.find(([re]) => re.test(pathname))?.[1];
    document.title = page ? `${page} · ProfJero Connect` : 'ProfJero Connect — Bulk SMS, Campaigns & SMS API for Ghana';
  }, [pathname]);
  return null;
}
