type MarketStatsProps = {
  yesPercentage: number;
  noPercentage: number;
  totalPredictions: number;
};

export function MarketStats({
  yesPercentage,
  noPercentage,
  totalPredictions
}: MarketStatsProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">
          Participación
        </span>
        <span className="text-sm text-neutral-500">
          {totalPredictions} {totalPredictions === 1 ? "predicción" : "predicciones"}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-neutral-600">Sí</span>
            <span className="font-medium text-neutral-700">{yesPercentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-neutral-700 transition-all"
              style={{ width: `${yesPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-neutral-600">No</span>
            <span className="font-medium text-neutral-700">{noPercentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-neutral-400 transition-all"
              style={{ width: `${noPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
