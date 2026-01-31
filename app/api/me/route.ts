import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  jsonResponse,
  getAuthenticatedUser,
  isApiError
} from "@/lib/apiHelpers";

// API-10: GET /api/me - Get user profile with aggregated data
export async function GET(req: NextRequest) {
  const authResult = await getAuthenticatedUser(req);
  if (isApiError(authResult)) {
    return jsonResponse(authResult.status, { error: authResult.error });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return jsonResponse(500, { error: "missing_supabase_config" });
  }

  const authHeader = req.headers.get("Authorization")!;
  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader }
    },
    auth: { persistSession: false }
  });

  const [predictionsResult, reputationResult] = await Promise.all([
    supabase
      .from("predictions")
      .select(
        `
        id,
        market_id,
        choice,
        created_at,
        markets (
          id,
          topic_text,
          question_text,
          status,
          resolved_outcome
        )
      `
      )
      .eq("user_id", authResult.id)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("reputation_points")
      .select("points")
      .eq("user_id", authResult.id)
  ]);

  const predictions = predictionsResult.data ?? [];
  const reputationPoints = reputationResult.data ?? [];

  const totalPoints = reputationPoints.reduce(
    (sum, entry) => sum + entry.points,
    0
  );

  type MarketJoin = {
    status: string;
    resolved_outcome: boolean | null;
  } | null;

  const correctPredictions = predictions.filter((p) => {
    const market = p.markets as unknown as MarketJoin;
    if (!market || market.status !== "resolved") return false;
    return (
      (market.resolved_outcome === true && p.choice === "yes") ||
      (market.resolved_outcome === false && p.choice === "no")
    );
  }).length;

  const resolvedPredictions = predictions.filter((p) => {
    const market = p.markets as unknown as MarketJoin;
    return market?.status === "resolved";
  }).length;

  return jsonResponse(200, {
    id: authResult.id,
    email: authResult.email,
    role: authResult.role,
    reputation: {
      total_points: totalPoints,
      correct_predictions: correctPredictions,
      total_resolved: resolvedPredictions,
      accuracy:
        resolvedPredictions > 0
          ? Math.round((correctPredictions / resolvedPredictions) * 100)
          : null
    },
    predictions: predictions.map((p) => ({
      id: p.id,
      market_id: p.market_id,
      choice: p.choice,
      created_at: p.created_at,
      market: p.markets
    }))
  });
}
