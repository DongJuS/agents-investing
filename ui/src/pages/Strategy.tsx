/**
 * ui/src/pages/Strategy.tsx — Strategy A 토너먼트 + Strategy B 토론 뷰
 */
import { useState } from "react";
import TournamentTable from "@/components/TournamentTable/TournamentTable";
import { useDebateList, useDebateTranscript, useStrategyBSignals } from "@/hooks/useSignals";
import { signalBadgeClass } from "@/utils/api";

function parseRoundBlocks(content: string | null): Record<number, string> {
  if (!content) return {};
  const entries = content
    .split(/\n\n(?=\[Round\s+\d+\])/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const rounds: Record<number, string> = {};
  entries.forEach((entry) => {
    const matched = entry.match(/^\[Round\s+(\d+)\]\s*([\s\S]*)$/);
    if (!matched) return;
    const round = Number(matched[1]);
    rounds[round] = (matched[2] || "").trim();
  });
  return rounds;
}

function extractPolicy(content: string | null): string | null {
  if (!content) return null;
  const matched = content.match(/\[Policy\][\s\S]*$/);
  return matched ? matched[0].trim() : null;
}

export default function Strategy() {
  const [selectedDebateId, setSelectedDebateId] = useState<number | null>(null);
  const { data: strategyB, isLoading: strategyBLoading } = useStrategyBSignals();
  const { data: debateList, isLoading: debateListLoading } = useDebateList(30);
  const { data: debate, isLoading: debateLoading } = useDebateTranscript(selectedDebateId);
  const proposerByRound = parseRoundBlocks(debate?.proposer_content ?? null);
  const challenger1ByRound = parseRoundBlocks(debate?.challenger1_content ?? null);
  const challenger2ByRound = parseRoundBlocks(debate?.challenger2_content ?? null);
  const synthesizerByRound = parseRoundBlocks(debate?.synthesizer_content ?? null);
  const policyText = extractPolicy(debate?.synthesizer_content ?? null);
  const roundSet = new Set<number>([
    ...Object.keys(proposerByRound).map(Number),
    ...Object.keys(challenger1ByRound).map(Number),
    ...Object.keys(challenger2ByRound).map(Number),
    ...Object.keys(synthesizerByRound).map(Number),
  ]);
  const rounds = [...roundSet].sort((a, b) => a - b);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">전략 현황</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy A */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <h2 className="text-base font-semibold text-gray-800">
              Strategy A — Tournament
            </h2>
          </div>
          <TournamentTable />
        </div>

        {/* Strategy B */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h2 className="text-base font-semibold text-gray-800">
              Strategy B — Consensus/Debate
            </h2>
          </div>

          {strategyBLoading ? (
            <div className="card text-center py-10 text-gray-400">
              <p>Strategy B 시그널 로딩 중</p>
            </div>
          ) : strategyB?.signals.length ? (
            <div className="space-y-3">
              {strategyB.signals.map((signal) => (
                <button
                  key={`${signal.ticker}-${signal.debate_transcript_id ?? "no-debate"}`}
                  className="card w-full text-left hover:border-blue-300 transition-colors"
                  onClick={() => setSelectedDebateId(signal.debate_transcript_id)}
                  disabled={!signal.debate_transcript_id}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{signal.ticker}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {signal.reasoning_summary ?? "요약 없음"}
                      </p>
                    </div>
                    <span className={`badge ${signalBadgeClass(signal.signal)}`}>{signal.signal}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="card text-center py-10 text-gray-400">
              <p>Strategy B 데이터가 없습니다.</p>
            </div>
          )}

          <div className="card space-y-2">
            <p className="text-sm font-semibold text-gray-800">최근 Debate 이력</p>
            {debateListLoading ? (
              <p className="text-sm text-gray-500">이력 로딩 중...</p>
            ) : debateList?.items.length ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {debateList.items.map((item) => (
                  <button
                    key={item.id}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                      selectedDebateId === item.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedDebateId(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-800">
                        #{item.id} · {item.ticker}
                      </p>
                      <span className={`badge ${signalBadgeClass(item.final_signal ?? "HOLD")}`}>
                        {item.final_signal ?? "HOLD"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {item.date} · rounds {item.rounds} · conf{" "}
                      {item.confidence !== null ? item.confidence.toFixed(3) : "-"} · consensus{" "}
                      {item.consensus_reached ? "yes" : "no"}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">토론 이력이 없습니다.</p>
            )}
          </div>

          {selectedDebateId && (
            <div className="card space-y-2">
              <p className="text-sm font-semibold text-gray-800">
                Debate #{selectedDebateId}
              </p>
              {debateLoading ? (
                <p className="text-sm text-gray-500">토론 전문 로딩 중...</p>
              ) : debate ? (
                <>
                  <p className="text-xs text-gray-500">
                    {debate.ticker} · rounds: {debate.rounds} · final: {debate.final_signal ?? "HOLD"} ·
                    confidence: {debate.confidence !== null ? debate.confidence.toFixed(3) : "-"} ·
                    consensus: {debate.consensus_reached ? "yes" : "no"}
                  </p>
                  {!debate.consensus_reached && debate.no_consensus_reason && (
                    <p className="text-xs text-amber-700">
                      no_consensus_reason: {debate.no_consensus_reason}
                    </p>
                  )}
                  {rounds.length ? (
                    <div className="space-y-2">
                      {rounds.map((roundNo) => (
                        <div key={roundNo} className="rounded-xl border border-gray-200 p-3">
                          <p className="text-xs font-semibold text-gray-800">Round {roundNo}</p>
                          <div className="mt-2 text-xs text-gray-700 space-y-2">
                            <p><strong>Proposer:</strong> {proposerByRound[roundNo] ?? "-"}</p>
                            <p><strong>Challenger1:</strong> {challenger1ByRound[roundNo] ?? "-"}</p>
                            <p><strong>Challenger2:</strong> {challenger2ByRound[roundNo] ?? "-"}</p>
                            <p><strong>Synthesizer:</strong> {synthesizerByRound[roundNo] ?? "-"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-700 space-y-1">
                      <p><strong>Proposer:</strong> {debate.proposer_content ?? "-"}</p>
                      <p><strong>Challenger1:</strong> {debate.challenger1_content ?? "-"}</p>
                      <p><strong>Challenger2:</strong> {debate.challenger2_content ?? "-"}</p>
                      <p><strong>Synthesizer:</strong> {debate.synthesizer_content ?? "-"}</p>
                    </div>
                  )}
                  {policyText && (
                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-2">
                      {policyText}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">토론 전문을 불러오지 못했습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
