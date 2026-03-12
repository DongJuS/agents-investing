/**
 * ui/src/pages/Market.tsx — 시장 데이터 / KOSPI·KOSDAQ 지수
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";

function useMarketIndex() {
  return useQuery({
    queryKey: ["market", "index"],
    queryFn: async () => {
      const { data } = await api.get("/market/index");
      return data;
    },
    refetchInterval: 30_000,
  });
}

export default function Market() {
  const { data: index, isLoading } = useMarketIndex();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">시장 데이터</h1>

      {/* 지수 카드 */}
      <div className="grid grid-cols-2 gap-4">
        {["kospi", "kosdaq"].map((key) => {
          const item = index?.[key];
          return (
            <div key={key} className="card">
              <p className="text-xs text-gray-500 font-medium">
                {key.toUpperCase()}
              </p>
              {isLoading ? (
                <div className="h-8 bg-gray-100 rounded mt-2 animate-pulse" />
              ) : (
                <>
                  <p className="number-lg mt-1">
                    {item?.value?.toLocaleString("ko-KR") ?? "—"}
                  </p>
                  <p
                    className={`text-sm font-medium mt-0.5 ${
                      (item?.change_pct ?? 0) >= 0
                        ? "text-positive"
                        : "text-negative"
                    }`}
                  >
                    {item?.change_pct != null
                      ? `${item.change_pct >= 0 ? "+" : ""}${item.change_pct.toFixed(2)}%`
                      : "—"}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="card text-center py-10 text-gray-400">
        <p>종목별 차트 및 OHLCV 조회</p>
        <p className="text-xs mt-1">Phase 5에서 캔들스틱 차트 구현 예정</p>
      </div>
    </div>
  );
}
