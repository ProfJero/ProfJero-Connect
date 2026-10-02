import { parsePhoneList } from './phone';
import type { Contact, ContactGroup } from './types';

export interface RecipientDraft {
  /** Typed or pasted numbers, raw text. */
  manualText: string;
  /** Numbers from an uploaded file, normalized. */
  uploaded: string[];
  uploadedName: string | null;
  contacts: Contact[];
  groupIds: string[];
}

export const emptyRecipients: RecipientDraft = {
  manualText: '',
  uploaded: [],
  uploadedName: null,
  contacts: [],
  groupIds: [],
};

/**
 * Recipient count for the cost preview. Numbers and individual contacts are
 * de-duplicated exactly; group members can overlap with them, so when
 * groups are involved the figure is an upper bound ("up to N"). The server
 * de-duplicates the final list and charges only for unique numbers.
 */
export function summarizeRecipients(draft: RecipientDraft, groups: ContactGroup[]) {
  const phones = new Set<string>([
    ...parsePhoneList(draft.manualText).valid,
    ...draft.uploaded,
    ...draft.contacts.map((c) => c.phone),
  ]);
  const groupMembers = draft.groupIds.reduce(
    (sum, id) => sum + (groups.find((g) => g.id === id)?.contactCount ?? 0),
    0,
  );
  return {
    numbers: [...phones].filter(
      (p) => !draft.contacts.some((c) => c.phone === p),
    ),
    count: phones.size + groupMembers,
    isUpperBound: draft.groupIds.length > 0,
    invalidManual: parsePhoneList(draft.manualText).invalid,
  };
}
