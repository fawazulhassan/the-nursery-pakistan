import { supabase } from "@/integrations/supabase/client";

export type TransactionalEmailType = "order" | "booking" | "consultation";

export interface SendTransactionalEmailPayload {
  type: TransactionalEmailType;
  id: string;
}

/**
 * Prefer a Bearer token when available (logged-in user or anonymous). Use `signInAnonymously`
 * response token directly — `getSession()` can lag right after sign-in.
 *
 * Production `send-transactional-email` is deployed with verify_jwt=false so invoke still works
 * with only the anon apikey when no JWT exists — guest email does not depend on anonymous auth.
 *
 * Anonymous sign-in remains a best-effort enhancement if you ever turn JWT verification back on.
 */
async function authorizationHeaderForFunctions(): Promise<Record<string, string> | undefined> {
  const {
    data: { session: existing },
  } = await supabase.auth.getSession();

  if (existing?.access_token) {
    return { Authorization: `Bearer ${existing.access_token}` };
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.warn("[sendEmail] signInAnonymously failed — invoking without Bearer (requires verify_jwt=false on Edge)", error);
    return undefined;
  }

  const token = data.session?.access_token;
  if (!token) {
    console.warn("[sendEmail] No token after signInAnonymously — invoking without Bearer");
    return undefined;
  }

  return { Authorization: `Bearer ${token}` };
}

/**
 * Sends transactional emails via Edge Function. Never throws.
 */
export async function sendEmail(payload: SendTransactionalEmailPayload): Promise<void> {
  try {
    const headers = await authorizationHeaderForFunctions();

    const { data, error } = await supabase.functions.invoke("send-transactional-email", {
      body: payload,
      ...(headers ? { headers } : {}),
    });

    if (error) {
      console.error("[sendEmail] invoke error", error, "context:", (error as { context?: unknown }).context);
    } else {
      console.log("[sendEmail] invoke ok", payload.type, payload.id, data);
    }
  } catch (e) {
    console.error("[sendEmail] unexpected", e);
  }
}
