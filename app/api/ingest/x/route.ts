import { NextRequest } from "next/server";
import {
  jsonResponse,
  requireAdminOrCron,
  isApiError
} from "@/lib/apiHelpers";

type XTrend = {
  id: string;
  name: string;
  category?: string;
};

async function fetchTrendsFromX(token?: string): Promise<{
  topics: XTrend[];
  mocked: boolean;
}> {
  if (!token) {
    return {
      topics: [
        { id: "mock-1", name: "Carlos Rivera anuncia concierto" },
        { id: "mock-2", name: "Sofia Reyes: suspensión de cuenta oficial" }
      ],
      mocked: true
    };
  }

  const response = await fetch(
    "https://api.x.com/2/trends/place.json?id=1",
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    return { topics: [], mocked: false };
  }

  const data = await response.json().catch(() => []);
  const trends = Array.isArray(data?.[0]?.trends) ? data[0].trends : [];

  const topics = trends.map(
    (trend: { name: string; promoted_content?: string }) => ({
      id: trend.name,
      name: trend.name,
      category: trend.promoted_content ? "promo" : undefined
    })
  );

  return { topics, mocked: false };
}

// API-01: POST /api/ingest/x - Fetch raw trending topics from X API
export async function POST(req: NextRequest) {
  const authResult = await requireAdminOrCron(req);
  if (isApiError(authResult)) {
    return jsonResponse(authResult.status, { error: authResult.error });
  }

  const xBearerToken = process.env.X_BEARER_TOKEN;
  const { topics, mocked } = await fetchTrendsFromX(xBearerToken);

  return jsonResponse(200, {
    topics,
    mocked,
    fetched_at: new Date().toISOString()
  });
}
