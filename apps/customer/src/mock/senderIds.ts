// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// Sender IDs are the customer's own. Max 11 characters each.

export type SenderIdStatus = 'Approved' | 'Pending Approval' | 'Rejected' | 'Inactive';

export interface SenderIdRow {
  id: number;
  value: string;
  purpose: string;
  status: SenderIdStatus;
  requestedDate: string;
  approvedDate: string;
}

export const senderIds: SenderIdRow[] = [
  {
    id: 1,
    value: 'SUNNYTECH',
    purpose: 'Business notifications,\ncustomer messages',
    status: 'Approved',
    requestedDate: 'Apr 12, 2025 10:24 AM',
    approvedDate: 'Apr 14, 2025 09:15 AM',
  },
  {
    id: 2,
    value: 'SUNNYALERT',
    purpose: 'Service alerts,\naccount updates',
    status: 'Approved',
    requestedDate: 'Mar 28, 2025 02:16 PM',
    approvedDate: 'Mar 30, 2025 11:32 AM',
  },
  {
    id: 3,
    value: 'SUNNYPROMO',
    purpose: 'Marketing and\npromotional messages',
    status: 'Pending Approval',
    requestedDate: 'Jun 05, 2025 11:30 AM',
    approvedDate: '-',
  },
  {
    id: 4,
    value: 'SUNNYHELP',
    purpose: 'Customer support\nand enquiries',
    status: 'Rejected',
    requestedDate: 'May 18, 2025 03:22 PM',
    approvedDate: '-',
  },
  {
    id: 5,
    value: 'SUNNYAPP',
    purpose: 'App notifications,\nservice updates',
    status: 'Approved',
    requestedDate: 'Apr 02, 2025 08:17 AM',
    approvedDate: 'Apr 04, 2025 01:05 PM',
  },
  {
    id: 6,
    value: 'SUNNYSHOP',
    purpose: 'Order updates,\npurchase receipts',
    status: 'Inactive',
    requestedDate: 'Jan 15, 2025 12:40 PM',
    approvedDate: 'Jan 18, 2025 10:12 AM',
  },
  {
    id: 7,
    value: 'SUNNYTEAM',
    purpose: 'Internal team\ncommunication',
    status: 'Approved',
    requestedDate: 'Feb 10, 2025 09:45 AM',
    approvedDate: 'Feb 12, 2025 04:20 PM',
  },
];

export const senderIdsPagination = {
  from: 1,
  to: 7,
  total: 7,
};

export const senderIdStatusOptions = [
  'All Statuses',
  'Approved',
  'Pending Approval',
  'Rejected',
  'Inactive',
];