/**
 * 에이전트 헬스 상태를 실시간으로 표시하는 컴포넌트
 */
import { useAgentStatus } from "@/hooks/useAgentStatus";

const AGENT_LABELS: Record<string, string> = {
  collector_agent: "수집기",
  predictor_1: "예측 1(Claude)",
  predictor_2: "예측 2(Claude)",
  predictor_3: "예측 3(GPT)",
  predictor_4: "예측 4(GPT)",
  predictor_5: "예측 5(Gemini)",
  portfolio_manager_agent: "운용역",
  notifier_agent: "알리미",
  orchestrator_agent: "지휘자",
};

export default function AgentStatusBar() {
  const { data: agents, isLoading } = useAgentStatus();

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">에이전트 상태</h3>
      <div className="flex flex-wrap gap-3">
        {agents?.map((agent) => (
          <div
            key={agent.agent_id}
            className="flex items-center gap-1.5"
            title={agent.last_action ?? ""}
          >
            <span
              className={
                agent.status === "healthy"
                  ? "dot-healthy"
                  : agent.status === "degraded"
                  ? "dot-degraded"
                  : "dot-dead"
              }
            />
            <span className="text-xs text-gray-600">
              {AGENT_LABELS[agent.agent_id] ?? agent.agent_id}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
