import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { jsonResponse } from "@/lib/apiHelpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// API-05: GET /api/markets/:id - Get single market with resolution rule
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return jsonResponse(400, { error: "missing_market_id" });
  }

  const supabase = await createSupabaseServerClient();

  const { data: market, error } = await supabase
    .from("markets")
    .select(
      `
      *,
      resolution_rules (
        id,
        name,
        source,
        rule_json,
        deterministic
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return jsonResponse(500, { error: "query_failed" });
  }

  if (!market) {
    return jsonResponse(404, { error: "market_not_found" });
  }

  return jsonResponse(200, { market });
}
