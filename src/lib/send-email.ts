type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { ok: true } | { ok: false; error: string };

function getFromAddress(): string | null {
  const from = process.env.EMAIL_FROM?.trim();
  return from || null;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getFromAddress();

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Email не налаштовано (RESEND_API_KEY, EMAIL_FROM)",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message =
        typeof data.message === "string" ? data.message : `HTTP ${res.status}`;
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Помилка відправки email",
    };
  }
}
