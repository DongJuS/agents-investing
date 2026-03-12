/**
 * Strategy A 토너먼트 순위표 컴포넌트
 */
import { useTournament } from "@/hooks/useSignals";

const LLM_ICONS: Record<string, string> = {
  "claude-sonnet-4-6": "🟣",
  "gpt-4o": "🟢",
  "gemini-1.5-pro": "🔵",
};

export default function TournamentTable() {
  const { data, isLoading } = useTournament();

  if (isLoading) {
    return (
      <div className="card space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 mb-4">
        Strategy A 토너먼트 — 최근 {data?.period_days}일 누적 정확도
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b border-surface-border">
            <th className="pb-2 pr-3">순위</th>
            <th className="pb-2 pr-3">에이전트</th>
            <th className="pb-2 pr-3">모델</th>
            <th className="pb-2 pr-3 text-right">정확도</th>
            <th className="pb-2 text-right">전적</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {data?.rankings.map((r, idx) => (
            <tr
              key={r.agent_id}
              className={r.is_current_winner ? "bg-brand-50" : ""}
            >
              <td className="py-2.5 pr-3 font-bold text-gray-400">
                {idx + 1}
              </td>
              <td className="py-2.5 pr-3 font-medium text-gray-800">
                {r.is_current_winner && "👑 "}
                {r.persona}
              </td>
              <td className="py-2.5 pr-3 text-gray-500">
                {LLM_ICONS[r.llm_model] ?? "🤖"} {r.llm_model}
              </td>
              <td className="py-2.5 pr-3 text-right font-semibold">
                {r.rolling_accuracy != null
                  ? `${(r.rolling_accuracy * 100).toFixed(1)}%`
                  : "—"}
              </td>
              <td className="py-2.5 text-right text-gray-500">
                {r.correct}/{r.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
