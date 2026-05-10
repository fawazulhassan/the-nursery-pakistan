import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { buildAuthVerifyUrl } from "../_shared/auth-verify-url.ts";
import { replyToEmail, sendHtmlEmail } from "../_shared/resend.ts";
import ResetPasswordEmail from "../_shared/email-templates/ResetPasswordEmail.tsx";
import VerifyEmail from "../_shared/email-templates/VerifyEmail.tsx";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 400 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  const secretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (!secretRaw) {
    console.error("[auth-send-email] SEND_EMAIL_HOOK_SECRET is not set");
    return new Response(
      JSON.stringify({ error: { message: "Hook secret not configured", http_code: 500 } }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const hookSecret = secretRaw.replace("v1,whsec_", "");
  const wh = new Webhook(hookSecret);

  let verified: {
    user: { email: string };
    email_data: {
      token_hash: string;
      email_action_type: string;
      redirect_to?: string | null;
      token?: string;
      site_url?: string;
    };
  };

  try {
    verified = wh.verify(payload, headers) as typeof verified;
  } catch (e) {
    console.error("[auth-send-email] webhook verify failed", e);
    return new Response(JSON.stringify({ error: { message: "Invalid webhook signature", http_code: 401 } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    console.error("[auth-send-email] SUPABASE_URL missing");
    return new Response(JSON.stringify({ error: { message: "Server misconfigured", http_code: 500 } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user, email_data } = verified;
  const action = email_data.email_action_type;
  const bizLoc = Deno.env.get("BUSINESS_LOCATION") ?? "Kasur, Pakistan";

  const unsupportedHandledQuietly = [
    "magiclink",
    "email_change",
    "invite",
    "email_change_new",
    "reauthentication",
  ] as const;

  if ((unsupportedHandledQuietly as readonly string[]).includes(action)) {
    console.log(`[auth-send-email] skipping send for email_action_type=${action}`);
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action !== "signup" && action !== "recovery") {
    console.log(`[auth-send-email] unhandled email_action_type=${action} — returning 200`);
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const confirmUrl = buildAuthVerifyUrl(supabaseUrl, {
    token_hash: email_data.token_hash,
    email_action_type: action,
    redirect_to: email_data.redirect_to,
  });

  try {
    const html =
      action === "signup"
        ? await renderAsync(React.createElement(VerifyEmail, { confirmUrl, businessLocation: bizLoc }))
        : await renderAsync(
            React.createElement(ResetPasswordEmail, { resetUrl: confirmUrl, businessLocation: bizLoc }),
          );

    const subject =
      action === "signup"
        ? "Verify your email - The Nursery Pakistan"
        : "Reset your password - The Nursery Pakistan";

    const { error } = await sendHtmlEmail({
      to: user.email,
      subject,
      html,
      replyTo: replyToEmail(),
    });

    if (error) {
      console.error("[auth-send-email] Resend error", error);
      return new Response(
        JSON.stringify({ error: { message: "Email delivery failed", http_code: 500 } }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (e) {
    console.error("[auth-send-email] render/send failed", e);
    return new Response(
      JSON.stringify({
        error: {
          message: e instanceof Error ? e.message : "send failed",
          http_code: 500,
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
