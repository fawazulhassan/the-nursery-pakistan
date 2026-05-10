/** Build GoTrue verify link (Send Email Hook). */
export function buildAuthVerifyUrl(
  supabaseUrl: string,
  emailData: {
    token_hash: string;
    email_action_type: string;
    redirect_to?: string | null;
  },
): string {
  const base = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/verify`;
  const params = new URLSearchParams({
    token: emailData.token_hash,
    type: emailData.email_action_type,
    redirect_to: emailData.redirect_to ?? "",
  });
  return `${base}?${params.toString()}`;
}
