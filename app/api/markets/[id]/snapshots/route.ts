import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { jsonResponse } from "@/lib/apiHelpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// API-06: GET /api/markets/:id/snapshots - Get market snapshots for time-series
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  if (!id) {
    return jsonResponse(400, { error: "missing_market_id" });
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("market_snapshots")
    .select("*")
    .eq("market_id", id)
    .order("snapshot_at", { ascending: true });

  if (from) {
    query = query.gte("snapshot_at", from);
  }

  if (to) {
    query = query.lte("snapshot_at", to);
  }

  const { data: snapshots, error } = await query;

  if (error) {
    return jsonResponse(500, { error: "query_failed" });
  }

  const latestSnapshot = snapshots?.length
    ? snapshots[snapshots.length - 1]
    : null;

  const latest = latestSnapshot
    ? {
        yes_percentage:
          latestSnapshot.total_predictions > 0
            ? Math.round(
                (latestSnapshot.yes_count / latestSnapshot.total_predictions) *
                  100
              )
            : 0,
        no_percentage:
          latestSnapshot.total_predictions > 0
            ? Math.round(
                (latestSnapshot.no_count / latestSnapshot.total_predictions) *
                  100
              )
            : 0
      }
    : null;

  return jsonResponse(200, {
    snapshots: snapshots ?? [],
    latest
  });
}
