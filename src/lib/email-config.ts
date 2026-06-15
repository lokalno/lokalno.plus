/** Відправник листів у Resend (домен lokalno.plus має бути Verified). */
export const DEFAULT_EMAIL_FROM = "Lokalno+ <noreply@lokalno.plus>";

export function getEmailFromAddress(): string {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_EMAIL_FROM;
}

export function getResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  return key || null;
}

export function isEmailConfigured(): boolean {
  return Boolean(getResendApiKey() && getEmailFromAddress());
}

export type EmailConfigStatus = {
  configured: boolean;
  from: string;
  hasApiKey: boolean;
  hasFromEnv: boolean;
};

export function getEmailConfigStatus(): EmailConfigStatus {
  const hasApiKey = Boolean(getResendApiKey());
  const hasFromEnv = Boolean(process.env.EMAIL_FROM?.trim());
  const from = getEmailFromAddress();

  return {
    configured: hasApiKey && Boolean(from),
    from,
    hasApiKey,
    hasFromEnv,
  };
}
