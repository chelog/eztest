/**
 * Only corporate addresses may register.
 * Shared by the server-side validation and the registration form hints.
 */
export const ALLOWED_REGISTRATION_DOMAINS = ['work.majestic-rp.ru', 'gta5rp.com'] as const;

export const REGISTRATION_DOMAIN_ERROR = `Регистрация доступна только для почт ${ALLOWED_REGISTRATION_DOMAINS.map((d) => `@${d}`).join(' и ')}`;

export function isAllowedRegistrationEmail(email: string | null | undefined): boolean {
  const domain = (email ?? '').trim().toLowerCase().split('@')[1];
  return !!domain && (ALLOWED_REGISTRATION_DOMAINS as readonly string[]).includes(domain);
}

/** Suggestions for the part typed so far: "ivan" / "ivan@gta" → full addresses on allowed domains */
export function suggestRegistrationEmails(input: string): string[] {
  const value = input.trim().toLowerCase();
  if (!value || value.startsWith('@')) return [];
  const [local, domainPart = ''] = value.split('@');
  if (!local) return [];
  return ALLOWED_REGISTRATION_DOMAINS.filter((domain) => domain.startsWith(domainPart) && `${local}@${domain}` !== value).map(
    (domain) => `${local}@${domain}`
  );
}
