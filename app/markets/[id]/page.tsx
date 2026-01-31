import { PredictionModal } from "@/components/PredictionModal";
import { MarketStats } from "@/components/MarketStats";
import { formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type MarketPageProps = {
  params: { id: string };
};

export default async function MarketPage({ params }: MarketPageProps) {
  const supabase = await createSupabaseServerClient();

  const { data: market, error } = await supabase
    .from("markets")
    .select(
      "id, topic_text, question_text, description, status, ends_at, starts_at, verification_source_url"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !market) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-neutral-600">Mercado no encontrado.</p>
      </main>
    );
  }

  const { data: snapshot } = await supabase
    .from("market_snapshots")
    .select("total_predictions, yes_count, no_count")
    .eq("market_id", params.id)
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const yesPercentage =
    snapshot && snapshot.total_predictions > 0
      ? Math.round((snapshot.yes_count / snapshot.total_predictions) * 100)
      : 0;
  const noPercentage =
    snapshot && snapshot.total_predictions > 0
      ? Math.round((snapshot.no_count / snapshot.total_predictions) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <div className="text-sm text-neutral-500">{market.topic_text}</div>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
          {market.question_text}
        </h1>
        {market.description ? (
          <p className="mt-3 text-sm text-neutral-600">{market.description}</p>
        ) : null}
        <div className="mt-4 text-sm text-neutral-600">
          Abre: {formatDateTime(market.starts_at)} · Cierra:{" "}
          {formatDateTime(market.ends_at)}
        </div>
        <div className="mt-2 inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
          Estado: {market.status}
        </div>
        {market.verification_source_url ? (
          <div className="mt-3">
            <a
              href={market.verification_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-600 underline hover:text-neutral-900"
            >
              Fuente de verificación
            </a>
          </div>
        ) : null}
      </div>

      {snapshot ? (
        <div className="mb-8">
          <MarketStats
            yesPercentage={yesPercentage}
            noPercentage={noPercentage}
            totalPredictions={snapshot.total_predictions}
          />
        </div>
      ) : null}

      <PredictionModal marketId={market.id} marketStatus={market.status} />
    </main>
  );
}
