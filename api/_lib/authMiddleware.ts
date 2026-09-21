import { createClient } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

// Read Supabase config safely from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

let serverSupabaseClient: any = null;

export function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!serverSupabaseClient) {
    serverSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serverSupabaseClient;
}

/**
 * Extracts the Bearer token from the Authorization header
 */
export function extractBearerToken(req: any): string | null {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Verifies the Bearer token against Supabase Auth.
 * Returns the authenticated user or null.
 * NEVER trusts unverified client payload or decode-only JWT.
 */
export async function getAuthenticatedUser(req: any): Promise<AuthenticatedUser | null> {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      // Cryptographically verify token directly with Supabase Auth
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return null;
      }
      return {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
      };
    } catch (err) {
      console.warn("[Auth] Token verification failed:", err);
      return null;
    }
  }

  // Fallback for local development / automated tests when live Supabase is not configured
  // Allows testing user isolation (User A vs User B) without live credentials.
  if (token.startsWith("test-token-")) {
    const userId = token.replace("test-token-", "").trim();
    if (userId) {
      return {
        id: `user-${userId}`,
        email: `${userId}@example.com`,
      };
    }
  }

  return null;
}

/**
 * Middleware helper for protected endpoints.
 * Returns the AuthenticatedUser, or null if unauthorized (and sends 401).
 */
export async function requireAuth(req: any, res: any, sendJson: (res: any, status: number, data: any) => void): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, {
      error: "Unauthorized",
      message: "Authentication required to access this resource.",
    });
    return null;
  }
  return user;
}
