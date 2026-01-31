import { NextRequest } from "next/server";
import {
  jsonResponse,
  getAuthenticatedUser,
  isApiError
} from "@/lib/apiHelpers";

// API-07: POST /api/predictions - Place prediction (proxies to Edge Function)
export async function POST(req: NextRequest) {
  const authResult = await getAuthenticatedUser(req);
  if (isApiError(authResult)) {
    return jsonResponse(authResult.status, { error: authResult.error });
  }

  let body: { market_id?: string; choice?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (!body.market_id || !body.choice || !body.amount) {
    return jsonResponse(400, { error: "missing_fields" });
  }

  if (!["yes", "no"].includes(body.choice)) {
    return jsonResponse(400, { error: "invalid_choice" });
  }

  if (body.amount <= 0) {
    return jsonResponse(400, { error: "invalid_amount" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    return jsonResponse(500, { error: "missing_supabase_url" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(401, { error: "missing_auth" });
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/placePrediction`;

  const response = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader
    },
    body: JSON.stringify({
      market_id: body.market_id,
      choice: body.choice,
      amount: body.amount
    })
  });

  const data = await response.json().catch(() => ({}));

  return jsonResponse(response.status, data);
}
