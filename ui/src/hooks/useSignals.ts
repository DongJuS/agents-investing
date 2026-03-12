/**
 * ui/src/hooks/useSignals.ts — 전략 시그널 조회 훅
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";

export interface CombinedSignal {
  ticker: string;
  strategy_a_signal: string | null;
  strategy_b_signal: string | null;
  combined_signal: string;
  combined_confidence: number | null;
  conflict: boolean;
}

export interface TournamentRank {
  agent_id: string;
  llm_model: string;
  persona: string;
  rolling_accuracy: number | null;
  correct: number;
  total: number;
  is_current_winner: boolean;
}

async function fetchCombinedSignals(): Promise<{
  blend_ratio: number;
  signals: CombinedSignal[];
}> {
  const { data } = await api.get("/strategy/combined");
  return data;
}

async function fetchTournament(): Promise<{
  period_days: number;
  rankings: TournamentRank[];
}> {
  const { data } = await api.get("/strategy/a/tournament");
  return data;
}

export function useCombinedSignals() {
  return useQuery({
    queryKey: ["strategy", "combined"],
    queryFn: fetchCombinedSignals,
    refetchInterval: 60_000,
  });
}

export function useTournament() {
  return useQuery({
    queryKey: ["strategy", "tournament"],
    queryFn: fetchTournament,
    refetchInterval: 60_000,
  });
}
