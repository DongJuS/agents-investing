/**
 * ui/src/pages/Portfolio.tsx — 포트폴리오 포지션 + 거래 이력
 */
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatKRW, formatPct } from "@/utils/api";

export default function Portfolio() {
  const { data: portfolio, isLoading } = usePortfolio();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">포트폴리오</h1>

      {/* 포지션 테이블 */}
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
                  <td
                    className={`py-3 text-right font-semibold ${
                      pos.unrealized_pnl >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {formatKRW(pos.unrealized_pnl)}
                  </td>
                  <td className="py-3 text-right text-gray-500">{pos.weight_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
