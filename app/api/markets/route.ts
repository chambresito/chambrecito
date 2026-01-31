import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  jsonResponse,
  requireAdmin,
  isApiError
} from "@/lib/apiHelpers";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

// API-04: GET /api/markets - List markets (public, RLS handles access)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const sort = searchParams.get("sort") ?? "ends_at";
  const order = searchParams.get("order") === "desc" ? false : true;

  const allowedSortFields = ["ends_at", "starts_at", "created_at", "topic_text"];
  const sortField = allowedSortFields.includes(sort) ? sort : "ends_at";

  const supabase = createSupabaseServerClient();

  const { data: markets, error, count } = await supabase
    .from("markets")
    .select("*", { count: "exact" })
    .order(sortField, { ascending: order })
    .range(offset, offset + limit - 1);

  if (error) {
    return jsonResponse(500, { error: "query_failed" });
  }

  return jsonResponse(200, {
    markets: markets ?? [],
    total: count ?? 0,
    limit,
    offset
  });
}

// API-03: POST /api/markets - Create market (admin only)
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (isApiError(authResult)) {
    return jsonResponse(authResult.status, { error: authResult.error });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  const requiredFields = [
    "source_topic_id",
    "topic_text",
    "topic_slug",
    "question_text",
    "subject_type",
    "starts_at",
    "ends_at"
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      return jsonResponse(400, { error: `missing_field_${field}` });
    }
  }

  const validSubjectTypes = ["public_figure", "organization", "protocol", "event"];
  if (!validSubjectTypes.includes(body.subject_type as string)) {
    return jsonResponse(400, { error: "invalid_subject_type" });
  }

  const adminClient = createSupabaseAdminClient();

  const marketData = {
    source_topic_id: body.source_topic_id,
    topic_text: body.topic_text,
    topic_slug: body.topic_slug,
    question_text: body.question_text,
    description: body.description ?? null,
    subject_type: body.subject_type,
    verification_required: body.verification_required ?? true,
    verification_source_url: body.verification_source_url ?? null,
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    status: "open",
    resolution_rule_id: body.resolution_rule_id ?? null
  };

  const { data: market, error } = await adminClient
    .from("markets")
    .insert(marketData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonResponse(409, { error: "market_already_exists" });
    }
    return jsonResponse(500, { error: "market_insert_failed" });
  }

  return jsonResponse(201, { market });
}
