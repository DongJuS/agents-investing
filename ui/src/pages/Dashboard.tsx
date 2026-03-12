/**
 * ui/src/pages/Dashboard.tsx — 홈 대시보드 (포트폴리오 요약 + 성과 추이 + 시그널 + 에이전트 상태)
 */
import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { usePortfolio, usePerformance, usePerformanceSeries } from "@/hooks/usePortfolio";
import { useCombinedSignals } from "@/hooks/useSignals";
import AgentStatusBar from "@/components/AgentStatusBar/AgentStatusBar";
import SignalCard from "@/components/SignalCard/SignalCard";
import { formatKRW, formatPct } from "@/utils/api";

function compactDate(value: string): string {
  return value.slice(5);
}

export default function Dashboard() {
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: signalData, isLoading: signalLoading } = useCombinedSignals();
  const { data: perf, isLoading: perfLoading } = usePerformance("monthly");
  const { data: perfSeries, isLoading: seriesLoading } = usePerformanceSeries("monthly");

  const chartData = useMemo(
    () =>
      (perfSeries?.points ?? []).map((point) => ({
        ...point,
        label: compactDate(point.date),
      })),
    [perfSeries]
  );

  return (
    <div className="page-shell">
      <div className="hero-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kpi-label">ALPHA TRADING CENTER</p>
            <h1 className="section-title mt-1">대시보드</h1>
            <p className="section-sub mt-1.5">
              {new Date().toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>
          {portfolio?.is_paper && <span className="chip">페이퍼 트레이딩</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="kpi-label">총 평가금액</p>
          <p className="number-lg mt-1">{portfolioLoading ? "—" : formatKRW(portfolio?.total_value ?? 0)}</p>
        </div>

        <div className="card">
          <p className="kpi-label">평가손익</p>
          {portfolioLoading ? (
            <p className="number-lg mt-1 text-gray-400">—</p>
          ) : (
            <>
              <p className={`number-lg mt-1 ${(portfolio?.total_pnl ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                {formatKRW(portfolio?.total_pnl ?? 0)}
              </p>
              <p className={`mt-0.5 text-sm font-semibold ${(portfolio?.total_pnl_pct ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                {formatPct(portfolio?.total_pnl_pct ?? 0)}
              </p>
            </>
          )}
        </div>

        <div className="card">
          <p className="kpi-label">30일 수익률</p>
          <p className={`number-lg mt-1 ${((perf?.return_pct ?? 0) >= 0 ? "text-profit" : "text-loss")}`}>
            {perfLoading ? "—" : formatPct(perf?.return_pct ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">KOSPI: {perf?.kospi_benchmark_pct == null ? "—" : formatPct(perf.kospi_benchmark_pct)}</p>
        </div>

        <div className="card">
          <p className="kpi-label">보유 종목 수</p>
          <p className="number-lg mt-1">
            {portfolioLoading ? "—" : portfolio?.positions.length ?? 0}
            <span className="ml-1 text-base font-semibold text-slate-400">종목</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">거래 {perf?.total_trades ?? 0}건</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800">누적 성과 추이 (30일)</h2>
          <p className="text-xs text-slate-500">실현손익 기준</p>
        </div>
        {seriesLoading || chartData.length === 0 ? (
          <div className="h-64 rounded-2xl bg-slate-100/80 animate-pulse" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(value: number) => `${Number(value).toFixed(2)}%`}
                  labelFormatter={(label) => `날짜: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="portfolio_return_pct"
                  name="Portfolio"
                  stroke="#1D5FE0"
                  strokeWidth={2.2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark_return_pct"
                  name="KOSPI Proxy"
                  stroke="#7A8594"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <AgentStatusBar />

      <div>
        <h2 className="mb-3 text-base font-bold text-slate-800">
          오늘의 시그널 {!signalLoading && `(${signalData?.signals.length ?? 0}건)`}
        </h2>
        {signalLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-slate-100/80" />
            ))}
          </div>
        ) : signalData?.signals.length === 0 ? (
          <div className="card py-10 text-center text-slate-400">
            <p>아직 오늘의 시그널이 없습니다.</p>
            <p className="text-xs mt-1">08:55 KST 이후 업데이트됩니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {signalData?.signals.map((signal, idx) => (
              <SignalCard key={`${signal.ticker}-${idx}`} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
