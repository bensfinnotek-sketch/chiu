import { requireAuth, getSupabaseServerClient } from "./authMiddleware.ts";
import { sendJson } from "./httpUtils.ts";
import { PLAN_ENTITLEMENTS, normalizePlan } from "../../src/config/planEntitlements.ts";

function toLevel(value: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  const parsed = Number(value);
  if (parsed >= 6) return 6;
  if (parsed >= 5) return 5;
  if (parsed >= 4) return 4;
  if (parsed >= 3) return 3;
  if (parsed >= 2) return 2;
  return 1;
}

export async function handleGetLearningPlan(req: any, res: any) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return sendJson(res, 503, { error: "Supabase is not configured." });
  }

  const [{ data: profile, error: profileError }, { data: subscription, error: subscriptionError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("hsk_level, learning_goal, daily_minutes")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (profileError) {
    return sendJson(res, 500, { error: `Không thể tải hồ sơ học tập: ${profileError.message}` });
  }
  if (subscriptionError) {
    return sendJson(res, 500, { error: `Không thể tải gói tài khoản: ${subscriptionError.message}` });
  }

  const plan = normalizePlan(
    subscription?.status === "active" || subscription?.status === "trialing"
      ? subscription?.plan
      : "free"
  );
  const entitlements = PLAN_ENTITLEMENTS[plan];
  const currentHsk = toLevel(profile?.hsk_level);
  const recommendedHsk = toLevel(Math.min(currentHsk, entitlements.maxHskLevel));

  return sendJson(res, 200, {
    userId: user.id,
    plan,
    subscriptionStatus: subscription?.status || "active",
    currentHsk,
    recommendedHsk,
    maxHskLevel: entitlements.maxHskLevel,
    entitlements,
    learningGoal: profile?.learning_goal || "conversation",
    dailyMinutes: profile?.daily_minutes || 15,
    upgradeRequiredForHsk3Plus: !entitlements.advancedHskLevels,
  });
}
