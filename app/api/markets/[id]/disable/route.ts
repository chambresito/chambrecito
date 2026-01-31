import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  jsonResponse,
  requireAdmin,
  isApiError
} from "@/lib/apiHelpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// API-09: POST /api/markets/:id/disable - Disable/cancel market (admin only)
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await requireAdmin(req);
  if (isApiError(authResult)) {
    return jsonResponse(authResult.status, { error: authResult.error });
  }

  if (!id) {
    return jsonResponse(400, { error: "missing_market_id" });
  }

  let body: { reason?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional for this endpoint
  }

  const adminClient = createSupabaseAdminClient();

  const { data: market, error: fetchError } = await adminClient
    .from("markets")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !market) {
    return jsonResponse(404, { error: "market_not_found" });
  }

  if (market.status !== "open") {
    return jsonResponse(409, { error: "market_not_open" });
  }

  const { error: updateError } = await adminClient
    .from("markets")
    .update({
      status: "canceled",
      resolution_evidence: body.reason
        ? { canceled_reason: body.reason }
        : null
    })
    .eq("id", id);

  if (updateError) {
    return jsonResponse(500, { error: "market_update_failed" });
  }

  return jsonResponse(200, {
    ok: true,
    market_id: id,
    status: "canceled"
  });
}
