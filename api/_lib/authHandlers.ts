import { extractBearerToken, requireAuth, getSupabaseServerClient } from "./authMiddleware.ts";
import { parseBody, sendJson } from "./httpUtils.ts";
import { safeText } from "./inputValidation.ts";

export async function handlePasswordReset(req: any, res: any) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return sendJson(res, 503, { error: "Authentication provider is not configured." });
  const body = parseBody(req);
  const email = safeText(body?.email, 160).toLowerCase();
  if (!email || !email.includes("@")) return sendJson(res, 400, { error: "A valid email is required." });
  const redirectTo = safeText(body?.redirectTo, 300) || process.env.APP_URL || undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
  if (error) return sendJson(res, 400, { error: "Could not start password reset." });
  return sendJson(res, 200, { ok: true });
}

export async function handleDeleteAccount(req: any, res: any) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;
  const token = extractBearerToken(req);
  const supabase = getSupabaseServerClient(token);
  if (!supabase) return sendJson(res, 503, { error: "Authentication provider is not configured." });

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return sendJson(res, 500, { error: "Could not delete account." });
  return sendJson(res, 200, { ok: true });
}
