/**
 * ui/src/hooks/useAgentStatus.ts — 에이전트 헬스 상태 폴링 훅
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";

export interface AgentStatus {
  agent_id: string;
  status: "healthy" | "degraded" | "dead";
  is_alive: boolean;
  last_action: string | null;
  metrics: { api_latency_ms: number | null; error_count_last_hour: number } | null;
  updated_at: string | null;
}

async function fetchAgentStatus(): Promise<AgentStatus[]> {
  const { data } = await api.get<{ agents: AgentStatus[] }>("/agents/status");
  return data.agents;
}

export function useAgentStatus() {
  return useQuery({
    queryKey: ["agents", "status"],
    queryFn: fetchAgentStatus,
    refetchInterval: 60_000,  // 60초 폴링
    staleTime: 30_000,
  });
}
