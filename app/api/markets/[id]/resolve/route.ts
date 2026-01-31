import { NextRequest } from "next/server";
import {
  jsonResponse,
  requireAdminOrCron,
  isApiError,
  isCronAuth
} from "@/lib/apiHelpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// API-08: POST /api/markets/:id/resolve - Resolve market (proxies to Edge Function)
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await requireAdminOrCron(req);
  if (isApiError(authResult)) {
    return jsonResponse(authResult.status, { error: authResult.error });
  }

  if (!id) {
    return jsonResponse(400, { error: "missing_market_id" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "missing_supabase_config" });
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/resolveMarket`;

  let authHeader: string;
  if (isCronAuth(authResult)) {
    authHeader = `Bearer ${serviceRoleKey}`;
  } else {
    authHeader = req.headers.get("Authorization")!;
  }

  const response = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader
    },
    body: JSON.stringify({ market_id: id })
  });

  const data = await response.json().catch(() => ({}));

  return jsonResponse(response.status, data);
}
