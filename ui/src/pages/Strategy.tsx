/**
 * ui/src/pages/Strategy.tsx — Strategy A 토너먼트 + Strategy B 토론 뷰
 */
import { useState } from "react";
import TournamentTable from "@/components/TournamentTable/TournamentTable";
import { useDebateTranscript, useStrategyBSignals } from "@/hooks/useSignals";
import { signalBadgeClass } from "@/utils/api";

export default function Strategy() {
  const [selectedDebateId, setSelectedDebateId] = useState<number | null>(null);
  const { data: strategyB, isLoading: strategyBLoading } = useStrategyBSignals();
  const { data: debate, isLoading: debateLoading } = useDebateTranscript(selectedDebateId);

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
                    {debate.ticker} · rounds: {debate.rounds} · final: {debate.final_signal ?? "HOLD"}
                  </p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p><strong>Proposer:</strong> {debate.proposer_content ?? "-"}</p>
                    <p><strong>Challenger1:</strong> {debate.challenger1_content ?? "-"}</p>
                    <p><strong>Challenger2:</strong> {debate.challenger2_content ?? "-"}</p>
                    <p><strong>Synthesizer:</strong> {debate.synthesizer_content ?? "-"}</p>
                  </div>
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
