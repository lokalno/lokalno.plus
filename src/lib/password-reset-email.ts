import { sendEmail } from "./send-email";

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  siteName: string;
};

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const subject = `${input.siteName}: скидання пароля`;

  const text =
    `Ви запросили скидання пароля на ${input.siteName}.\n\n` +
    `Перейдіть за посиланням (діє 1 годину):\n${input.resetUrl}\n\n` +
    `Якщо ви не запитували скидання — проігноруйте цей лист.`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <h2 style="color:#1d4ed8;margin-bottom:8px">${input.siteName}</h2>
      <p>Ви запросили скидання пароля. Натисніть кнопку нижче — посилання дійсне <strong>1 годину</strong>.</p>
      <p style="margin:24px 0">
        <a href="${input.resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
          Змінити пароль
        </a>
      </p>
      <p style="font-size:13px;color:#666">Або скопіюйте посилання в браузер:<br>
        <a href="${input.resetUrl}" style="color:#2563eb;word-break:break-all">${input.resetUrl}</a>
      </p>
      <p style="font-size:13px;color:#888;margin-top:24px">Якщо ви не запитували скидання пароля — просто проігноруйте цей лист.</p>
    </div>
  `;

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
  });
}
