/**
 * ui/src/pages/Dashboard.tsx — 홈 대시보드 (포트폴리오 요약 + 시그널 + 에이전트 상태)
 */
import { usePortfolio } from "@/hooks/usePortfolio";
import { useCombinedSignals } from "@/hooks/useSignals";
import AgentStatusBar from "@/components/AgentStatusBar/AgentStatusBar";
import SignalCard from "@/components/SignalCard/SignalCard";
import { formatKRW, formatPct } from "@/utils/api";

export default function Dashboard() {
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: signalData, isLoading: signalLoading } = useCombinedSignals();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
        {portfolio?.is_paper && (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            📄 페이퍼 트레이딩
          </span>
        )}
      </div>

      {/* 포트폴리오 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 font-medium">총 평가금액</p>
          <p className="number-lg mt-1">
            {portfolioLoading
              ? "—"
              : formatKRW(portfolio?.total_value ?? 0)}
          </p>
        </div>

        <div className="card">
          <p className="text-xs text-gray-500 font-medium">평가손익</p>
          {portfolioLoading ? (
            <p className="number-lg mt-1 text-gray-400">—</p>
          ) : (
            <>
              <p
                className={`number-lg mt-1 ${
                  (portfolio?.total_pnl ?? 0) >= 0
                    ? "text-positive"
                    : "text-negative"
                }`}
              >
                {formatKRW(portfolio?.total_pnl ?? 0)}
              </p>
              <p
                className={`text-sm font-medium mt-0.5 ${
                  (portfolio?.total_pnl_pct ?? 0) >= 0
                    ? "text-positive"
                    : "text-negative"
                }`}
              >
                {formatPct(portfolio?.total_pnl_pct ?? 0)}
              </p>
            </>
          )}
        </div>

        <div className="card">
          <p className="text-xs text-gray-500 font-medium">보유 종목 수</p>
          <p className="number-lg mt-1">
            {portfolioLoading ? "—" : portfolio?.positions.length ?? 0}
            <span className="text-base font-normal text-gray-400 ml-1">종목</span>
          </p>
        </div>
      </div>

      {/* 에이전트 상태 바 */}
      <AgentStatusBar />

      {/* 오늘의 시그널 */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          오늘의 시그널 {!signalLoading && `(${signalData?.signals.length ?? 0}건)`}
        </h2>
        {signalLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : signalData?.signals.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p>아직 오늘의 시그널이 없습니다.</p>
            <p className="text-xs mt-1">08:55 KST 이후 업데이트됩니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {signalData?.signals.map((signal) => (
              <SignalCard key={signal.ticker} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
