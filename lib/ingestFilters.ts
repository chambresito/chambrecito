export const UNSAFE_KEYWORDS = [
  "bet",
  "casino",
  "gambling",
  "wager",
  "odds"
];

export const DISALLOWED_PUBLIC_FIGURE_TOPICS = [
  "pregnancy",
  "pregnant",
  "embarazo",
  "sexual",
  "sexo",
  "health",
  "salud",
  "illness",
  "hospital",
  "allegedly",
  "rumor",
  "rumour",
  "dicen que",
  "people say",
  "tal vez",
  "quizá",
  "quizas"
];

export const PUBLIC_FIGURE_ALLOWLIST = [
  "carlos rivera",
  "sofia reyes"
];

const EMOJI_ONLY_REGEX = /^[\p{Extended_Pictographic}\s]+$/u;

export function isSafeTopic(name: string): boolean {
  const lower = name.toLowerCase();

  if (EMOJI_ONLY_REGEX.test(name)) {
    return false;
  }

  if (UNSAFE_KEYWORDS.some((word) => lower.includes(word))) {
    return false;
  }

  if (DISALLOWED_PUBLIC_FIGURE_TOPICS.some((word) => lower.includes(word))) {
    return false;
  }

  return true;
}

export function isPublicFigureTopic(name: string): boolean {
  const lower = name.toLowerCase();
  return PUBLIC_FIGURE_ALLOWLIST.some((person) => lower.includes(person));
}

export type VerificationMatch = {
  url: string;
  question: string;
};

const VERIFICATION_MAPPINGS: Array<{
  match: RegExp;
  url: string;
  question: string;
}> = [
  {
    match: /cuenta.*suspendid|account.*suspend/i,
    url: "https://help.x.com/en/rules-and-policies/x-rules",
    question: "¿La cuenta pública asociada fue suspendida oficialmente?"
  },
  {
    match: /comunicado|statement|apolog/i,
    url: "https://www.reuters.com/world/",
    question: "¿Se publicó un comunicado oficial verificable?"
  },
  {
    match: /demanda|lawsuit|arrest|convic/i,
    url: "https://www.justice.gov/news",
    question: "¿Existe un registro público oficial del evento legal?"
  }
];

export function resolveVerificationSource(
  topic: string
): VerificationMatch | null {
  const match = VERIFICATION_MAPPINGS.find((entry) => entry.match.test(topic));
  return match ? { url: match.url, question: match.question } : null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type TopicCandidate = {
  source_topic_id: string;
  topic_text: string;
  topic_slug: string;
  question_text: string | null;
  verification_source_url: string | null;
  subject_type: "public_figure" | "event";
  accepted: boolean;
  reject_reason: string | null;
};

export function normalizeTopic(topic: {
  id: string;
  name: string;
}): TopicCandidate {
  const { id, name } = topic;
  const slug = slugify(name);

  if (!isSafeTopic(name)) {
    return {
      source_topic_id: id,
      topic_text: name,
      topic_slug: slug,
      question_text: null,
      verification_source_url: null,
      subject_type: "event",
      accepted: false,
      reject_reason: "unsafe_topic"
    };
  }

  if (!isPublicFigureTopic(name)) {
    return {
      source_topic_id: id,
      topic_text: name,
      topic_slug: slug,
      question_text: null,
      verification_source_url: null,
      subject_type: "event",
      accepted: false,
      reject_reason: "not_public_figure"
    };
  }

  const verification = resolveVerificationSource(name);
  if (!verification) {
    return {
      source_topic_id: id,
      topic_text: name,
      topic_slug: slug,
      question_text: null,
      verification_source_url: null,
      subject_type: "public_figure",
      accepted: false,
      reject_reason: "no_verification_source"
    };
  }

  return {
    source_topic_id: id,
    topic_text: name,
    topic_slug: slug,
    question_text: verification.question,
    verification_source_url: verification.url,
    subject_type: "public_figure",
    accepted: true,
    reject_reason: null
  };
}
