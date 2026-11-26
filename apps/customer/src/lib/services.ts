/**
 * The service catalogue: one entry per thing a customer can use or buy.
 *
 * The sidebar, the topbar "Buy" menu, the dashboard launcher and the
 * Services page are all built from this list. To launch a new service,
 * add an entry here (status 'soon' until it can be bought) and its pages
 * under features/<service>; everything else picks it up.
 *
 * Copy rule: networks (MTN, Telecel, AirtelTigo) are fine to name; our
 * suppliers and payment gateway are not.
 */
import { MessageSquare, Wifi, Smartphone, Code2, type LucideIcon } from 'lucide-react';

export type ServiceId = 'sms' | 'data' | 'airtime' | 'api';

export interface ServiceLink {
  label: string;
  path: string;
}

export interface ServiceAccent {
  /** Icon tile (light + dark). */
  tile: string;
  /** Solid accent for buttons and progress. */
  solid: string;
  /** Text accent. */
  text: string;
  /** Soft gradient for hero cards. */
  gradient: string;
  /** Hover border on cards. */
  hoverBorder: string;
}

export interface ServiceDef {
  id: ServiceId;
  name: string;
  /** One line under the name. */
  tagline: string;
  /** Two-sentence pitch for the Services page. */
  description: string;
  icon: LucideIcon;
  accent: ServiceAccent;
  status: 'live' | 'soon';
  /** Shown as a small tag next to the name ("New"). */
  tag?: string;
  /** Where the service lives. */
  home: string;
  /** Main call to action. */
  primary: ServiceLink;
  /** What a customer buys, for the Buy menu (omit for non-purchasable services). */
  buy?: ServiceLink & { hint: string };
  /** Sub-pages for the sidebar. */
  pages: ServiceLink[];
  highlights: string[];
  /** Kind of offering, for grouping on the Services page. */
  kind: 'service' | 'developer';
}

export const SERVICES: ServiceDef[] = [
  {
    id: 'sms',
    name: 'Bulk SMS',
    tagline: 'Reach customers instantly with your own sender name',
    description:
      'Send one message or thousands, personalised with each contact’s name. Schedule campaigns, automate birthday wishes and track every delivery.',
    icon: MessageSquare,
    accent: {
      tile: 'bg-blue-50 text-[#1764e0] dark:bg-blue-500/15 dark:text-blue-300',
      solid: 'bg-[#1a6cf0] hover:bg-[#155cd0] text-white',
      text: 'text-[#1764e0] dark:text-blue-300',
      gradient: 'from-blue-50 to-white dark:from-blue-500/10 dark:to-slate-900',
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-500/40',
    },
    status: 'live',
    home: '/messaging',
    primary: { label: 'Send SMS', path: '/messaging/sms' },
    buy: { label: 'SMS units', path: '/wallet/add-funds', hint: 'Top up your SMS wallet' },
    pages: [
      { label: 'Send SMS', path: '/messaging/sms' },
      { label: 'Campaigns', path: '/messaging/campaigns' },
      { label: 'Message history', path: '/messaging/history' },
      { label: 'Sender IDs', path: '/messaging/sender-ids' },
    ],
    highlights: ['Personalised messages', 'Scheduled & birthday campaigns', 'Delivery reports', 'Pay as you go'],
    kind: 'service',
  },
  {
    id: 'data',
    name: 'Data Bundles',
    tagline: 'MTN, Telecel and AirtelTigo data in seconds',
    description:
      'Buy data for yourself, your staff or your customers. Pay with mobile money or card, and the bundle is sent straight to the number — refunded in full if it can’t be delivered.',
    icon: Wifi,
    accent: {
      tile: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      solid: 'bg-emerald-700 hover:bg-emerald-800 text-white',
      text: 'text-emerald-700 dark:text-emerald-300',
      gradient: 'from-emerald-50 to-white dark:from-emerald-500/10 dark:to-slate-900',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-500/40',
    },
    status: 'live',
    tag: 'New',
    home: '/services/data',
    primary: { label: 'Buy data', path: '/services/data' },
    buy: { label: 'Data bundle', path: '/services/data', hint: 'MTN · Telecel · AirtelTigo' },
    pages: [
      { label: 'Buy data', path: '/services/data' },
      { label: 'My orders', path: '/services/data/orders' },
    ],
    highlights: ['All major networks', 'Delivered in seconds', 'Mobile money or card', 'Full refund if not delivered'],
    kind: 'service',
  },
  {
    id: 'airtime',
    name: 'Airtime',
    tagline: 'Top up any Ghanaian number',
    description:
      'Send airtime to any MTN, Telecel or AirtelTigo number — one at a time or to your whole team at once.',
    icon: Smartphone,
    accent: {
      tile: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
      solid: 'bg-amber-500 hover:bg-amber-600 text-slate-900',
      text: 'text-amber-700 dark:text-amber-300',
      gradient: 'from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-900',
      hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-500/40',
    },
    status: 'soon',
    home: '/services/airtime',
    primary: { label: 'Coming soon', path: '/services/airtime' },
    buy: { label: 'Airtime', path: '/services/airtime', hint: 'Coming soon' },
    pages: [],
    highlights: ['All networks', 'Single or bulk top-ups'],
    kind: 'service',
  },
  {
    id: 'api',
    name: 'Developer API',
    tagline: 'Plug ProfJero Connect into your own systems',
    description:
      'Send SMS, check your balance, top up and schedule campaigns from your website or app with a simple REST API and copy-paste examples.',
    icon: Code2,
    accent: {
      tile: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
      solid: 'bg-purple-600 hover:bg-purple-700 text-white',
      text: 'text-purple-700 dark:text-purple-300',
      gradient: 'from-purple-50 to-white dark:from-purple-500/10 dark:to-slate-900',
      hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-500/40',
    },
    status: 'live',
    home: '/api',
    primary: { label: 'Get API keys', path: '/api' },
    pages: [
      { label: 'API keys', path: '/api' },
      { label: 'API docs', path: '/developers' },
    ],
    highlights: ['REST API', 'cURL, JavaScript, PHP, Python', 'Webhooks'],
    kind: 'developer',
  },
];

export const serviceById = (id: ServiceId): ServiceDef => SERVICES.find((s) => s.id === id)!;

/** Customer-facing services (excludes developer tools), live first. */
export const CUSTOMER_SERVICES = SERVICES.filter((s) => s.kind === 'service').sort(
  (a, b) => (a.status === b.status ? 0 : a.status === 'live' ? -1 : 1),
);

/** Mobile network brand chips. */
export const NETWORK_STYLES: Record<string, { chip: string; ring: string; dot: string }> = {
  MTN: { chip: 'bg-[#ffcc00] text-slate-900', ring: 'ring-[#ffcc00]', dot: 'bg-[#ffcc00]' },
  Telecel: { chip: 'bg-[#e30613] text-white', ring: 'ring-[#e30613]', dot: 'bg-[#e30613]' },
  AirtelTigo: { chip: 'bg-[#0a2d8f] text-white', ring: 'ring-[#0a2d8f]', dot: 'bg-[#0a2d8f]' },
};
export const networkStyle = (n: string) =>
  NETWORK_STYLES[n] ?? { chip: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100', ring: 'ring-slate-400', dot: 'bg-slate-400' };
