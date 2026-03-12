/**
 * ui/src/hooks/usePortfolio.ts — 포트폴리오 데이터 조회 훅
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";

export interface Position {
  ticker: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  unrealized_pnl: number;
  weight_pct: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  is_paper: boolean;
  positions: Position[];
}

async function fetchPortfolio(): Promise<PortfolioSummary> {
  const { data } = await api.get<PortfolioSummary>("/portfolio/positions");
  return data;
}

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio", "positions"],
    queryFn: fetchPortfolio,
    refetchInterval: 30_000,
  });
}
