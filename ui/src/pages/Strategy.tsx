/**
 * ui/src/pages/Strategy.tsx — Strategy A 토너먼트 + Strategy B 토론 뷰
 */
import TournamentTable from "@/components/TournamentTable/TournamentTable";

export default function Strategy() {
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
          <div className="card text-center py-10 text-gray-400">
            <p>토론 데이터 수집 대기 중</p>
            <p className="text-xs mt-1">Phase 4에서 구현 예정</p>
          </div>
        </div>
      </div>
    </div>
  );
}
