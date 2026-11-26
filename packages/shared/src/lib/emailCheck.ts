/**
 * Throwaway ("disposable") email services, used to farm free sign-up
 * credit. Not exhaustive — email verification is the real gate — but it
 * stops the common ones before an email is even sent.
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com', 'grr.la',
  'guerrillamailblock.com', '10minutemail.com', '10minutemail.net', '10minemail.com', 'tempmail.com', 'temp-mail.org',
  'temp-mail.io', 'tempmail.net', 'tempmailo.com', 'tempmail.dev', 'tempail.com', 'tempr.email', 'throwawaymail.com',
  'yopmail.com', 'yopmail.net', 'yopmail.fr', 'getnada.com', 'nada.email', 'trashmail.com', 'trashmail.net',
  'trashmail.de', 'dispostable.com', 'maildrop.cc', 'mailnesia.com', 'mailcatch.com', 'mintemail.com', 'mohmal.com',
  'emailondeck.com', 'fakeinbox.com', 'fakemail.net', 'mytemp.email', 'spamgourmet.com', 'spambox.us',
  'mailpoof.com', 'moakt.com', 'tmail.ws', 'tmpmail.org', 'tmpmail.net', 'burnermail.io', 'inboxkitten.com',
  'emailfake.com', 'email-fake.com', 'fakemailgenerator.com', 'luxusmail.org', 'mail.tm', 'mail.gw', 'tmails.net',
  'disposablemail.com', 'discard.email', 'discardmail.com', 'spam4.me', 'mailtemp.net', 'harakirimail.com',
  'mvrht.net', 'byom.de', 'jetable.org', 'mailforspam.com', 'tempinbox.com', 'easytrashmail.com', 'trbvm.com',
  'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com',
  'superrito.com', 'teleworm.us', 'armyspy.com', 'emltmp.com', 'dropmail.me', '1secmail.com', '1secmail.net',
  '1secmail.org', 'kzccv.com', 'qiott.com', 'wuuvo.com', 'icznn.com', 'vjuum.com', 'laafd.com', 'txcct.com',
  'zetmail.com', 'getairmail.com', 'airmail.cc', 'anonaddy.me', 'mailsac.com', 'inboxbear.com', 'minuteinbox.com',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // Sub-domains of known services (e.g. abc.mailinator.com).
  return [...DISPOSABLE_DOMAINS].some((d) => domain.endsWith(`.${d}`));
}
