import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export type ApiUser = {
  id: string;
  email?: string;
  role: string;
};

export type ApiError = {
  error: string;
  status: number;
};

export function jsonResponse<T>(status: number, body: T): NextResponse<T> {
  return NextResponse.json(body, { status });
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("Authorization") ?? "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return null;
  }
  return token;
}

function getRoleFromJwt(token: string): string {
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const decoded = JSON.parse(atob(payload));
    return decoded?.role ?? "";
  } catch {
    return "";
  }
}

export async function getAuthenticatedUser(
  req: NextRequest
): Promise<ApiUser | ApiError> {
  const token = getBearerToken(req);
  if (!token) {
    return { error: "missing_auth", status: 401 };
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");

  const authClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: { persistSession: false }
  });

  const { data, error } = await authClient.auth.getUser();
  if (error || !data?.user) {
    return { error: "invalid_session", status: 401 };
  }

  const role = getRoleFromJwt(token);

  return {
    id: data.user.id,
    email: data.user.email,
    role
  };
}

export function isApiError(
  result: ApiUser | ApiError | { cron: true }
): result is ApiError {
  return "error" in result;
}

export async function requireAdmin(
  req: NextRequest
): Promise<ApiUser | ApiError> {
  const result = await getAuthenticatedUser(req);
  if (isApiError(result)) {
    return result;
  }

  if (result.role !== "admin") {
    return { error: "admin_required", status: 403 };
  }

  return result;
}

export function validateCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const headerSecret = req.headers.get("X-Cron-Secret");
  return headerSecret === cronSecret;
}

export async function requireAdminOrCron(
  req: NextRequest
): Promise<ApiUser | ApiError | { cron: true }> {
  if (validateCronSecret(req)) {
    return { cron: true };
  }

  return requireAdmin(req);
}

export function isCronAuth(
  result: ApiUser | ApiError | { cron: true }
): result is { cron: true } {
  return "cron" in result;
}
