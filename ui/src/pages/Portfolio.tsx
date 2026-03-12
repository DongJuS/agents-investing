/**
 * ui/src/pages/Portfolio.tsx — 포트폴리오 포지션 + 성과 + 거래 이력
 */
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  usePerformance,
  usePerformanceSeries,
  usePortfolio,
  useTradeHistory,
  type PerformanceMetrics,
} from "@/hooks/usePortfolio";
import { formatKRW, formatPct } from "@/utils/api";

const PERIOD_OPTIONS: PerformanceMetrics["period"][] = ["daily", "weekly", "monthly", "all"];

function compactDate(value: string): string {
  return value.slice(5);
}

export default function Portfolio() {
  const [period, setPeriod] = useState<PerformanceMetrics["period"]>("monthly");
  const { data: portfolio, isLoading } = usePortfolio();
  const { data: perf, isLoading: perfLoading } = usePerformance(period);
  const { data: series, isLoading: seriesLoading } = usePerformanceSeries(period);
  const { data: history, isLoading: historyLoading } = useTradeHistory(1, 30);

  const chartData = useMemo(
    () =>
      (series?.points ?? []).map((point) => ({
        ...point,
        label: compactDate(point.date),
      })),
    [series]
  );

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between">
        <h1 className="section-title">포트폴리오</h1>
        <div className="flex items-center gap-2">
          {PERIOD_OPTIONS.map((item) => (
            <button
              key={item}
              onClick={() => setPeriod(item)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === item ? "bg-blue-600 text-white" : "bg-white/75 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="kpi-label">수익률</p>
          <p className={`number-lg mt-1 ${(perf?.return_pct ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
            {perfLoading ? "—" : formatPct(perf?.return_pct ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="kpi-label">MDD</p>
          <p className="number-lg mt-1 text-loss">{perfLoading ? "—" : formatPct(perf?.max_drawdown_pct ?? 0)}</p>
        </div>
        <div className="card">
          <p className="kpi-label">Sharpe</p>
          <p className="number-lg mt-1 text-gray-900">
            {perfLoading ? "—" : perf?.sharpe_ratio == null ? "—" : perf.sharpe_ratio.toFixed(3)}
          </p>
        </div>
        <div className="card">
          <p className="kpi-label">승률</p>
          <p className="number-lg mt-1 text-gray-900">{perfLoading ? "—" : `${Math.round((perf?.win_rate ?? 0) * 100)}%`}</p>
          <p className="mt-1 text-xs text-slate-500">거래 {perf?.total_trades ?? 0}건</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">누적 수익률 추이</h3>
          <p className="text-xs text-gray-500">vs KOSPI Proxy</p>
        </div>
        {seriesLoading || chartData.length === 0 ? (
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(value: number) => `${Number(value).toFixed(2)}%`} />
                <Line type="monotone" dataKey="portfolio_return_pct" stroke="#1D4ED8" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="benchmark_return_pct" stroke="#6B7280" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">보유 포지션</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : portfolio?.positions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">보유 중인 종목이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-surface-border">
                <th className="pb-2">종목</th>
                <th className="pb-2 text-right">수량</th>
                <th className="pb-2 text-right">평균가</th>
                <th className="pb-2 text-right">현재가</th>
                <th className="pb-2 text-right">평가손익</th>
                <th className="pb-2 text-right">비중</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {portfolio?.positions.map((pos) => (
                <tr key={pos.ticker}>
                  <td className="py-3">
                    <p className="font-medium text-gray-900">{pos.name}</p>
                    <p className="text-xs text-gray-400">{pos.ticker}</p>
                  </td>
                  <td className="py-3 text-right text-gray-700">{pos.quantity.toLocaleString()}</td>
                  <td className="py-3 text-right text-gray-700">{formatKRW(pos.avg_price)}</td>
                  <td className="py-3 text-right text-gray-700">{formatKRW(pos.current_price)}</td>
                  <td className={`py-3 text-right font-semibold ${pos.unrealized_pnl >= 0 ? "text-positive" : "text-negative"}`}>
                    {formatKRW(pos.unrealized_pnl)}
                  </td>
                  <td className="py-3 text-right text-gray-500">{pos.weight_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">최근 거래 이력</h3>
        {historyLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : history?.data.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-surface-border">
                <th className="pb-2">시각</th>
                <th className="pb-2">종목</th>
                <th className="pb-2 text-right">구분</th>
                <th className="pb-2 text-right">수량</th>
                <th className="pb-2 text-right">단가</th>
                <th className="pb-2 text-right">금액</th>
                <th className="pb-2 text-right">전략</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {history.data.map((item, idx) => (
                <tr key={`${item.executed_at}-${item.ticker}-${idx}`}>
                  <td className="py-2 text-xs text-gray-500">{item.executed_at.replace("T", " ")}</td>
                  <td className="py-2">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.ticker}</p>
                  </td>
                  <td className={`py-2 text-right font-semibold ${item.side === "BUY" ? "text-positive" : "text-negative"}`}>
                    {item.side}
                  </td>
                  <td className="py-2 text-right">{item.quantity.toLocaleString()}</td>
                  <td className="py-2 text-right">{formatKRW(item.price)}</td>
                  <td className="py-2 text-right">{formatKRW(item.amount)}</td>
                  <td className="py-2 text-right text-gray-600">{item.signal_source ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500">거래 이력이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
