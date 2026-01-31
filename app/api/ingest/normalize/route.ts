import { NextRequest } from "next/server";
import { jsonResponse, requireAdmin, isApiError } from "@/lib/apiHelpers";
import { normalizeTopic, TopicCandidate } from "@/lib/ingestFilters";

type NormalizeRequestBody = {
  topics: Array<{ id: string; name: string }>;
};

// API-02: POST /api/ingest/normalize - Apply safety filters and normalize topics
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (isApiError(authResult)) {
    return jsonResponse(authResult.status, { error: authResult.error });
  }

  let body: NormalizeRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (!body.topics || !Array.isArray(body.topics)) {
    return jsonResponse(400, { error: "missing_topics_array" });
  }

  const candidates: TopicCandidate[] = body.topics.map((topic) => {
    if (!topic.id || !topic.name) {
      return {
        source_topic_id: topic.id ?? "unknown",
        topic_text: topic.name ?? "",
        topic_slug: "",
        question_text: null,
        verification_source_url: null,
        subject_type: "event" as const,
        accepted: false,
        reject_reason: "invalid_topic_format"
      };
    }
    return normalizeTopic(topic);
  });

  const acceptedCount = candidates.filter((c) => c.accepted).length;
  const rejectedCount = candidates.filter((c) => !c.accepted).length;

  return jsonResponse(200, {
    candidates,
    accepted_count: acceptedCount,
    rejected_count: rejectedCount
  });
}
