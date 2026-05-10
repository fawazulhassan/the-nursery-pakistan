import { Resend } from "npm:resend@4.0.0";

export const EMAIL_FROM = "The Nursery Pakistan <hello@nurserypakistan.pk>";

export function replyToEmail(): string {
  return Deno.env.get("RESEND_REPLY_TO") ?? "fawazulhassan@gmail.com";
}

export function getResendClient(): Resend {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

export async function sendHtmlEmail(options: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ error?: unknown }> {
  try {
    const resend = getResendClient();
    const replyTo = options.replyTo ?? replyToEmail();
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo,
    });
    if (error) {
      console.error("[resend] send failed", error);
      return { error };
    }
    return {};
  } catch (e) {
    console.error("[resend] send exception", e);
    return { error: e };
  }
}
