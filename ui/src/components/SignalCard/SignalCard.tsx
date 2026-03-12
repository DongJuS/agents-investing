/**
 * BUY/SELL/HOLD 시그널 카드 컴포넌트
 */
import { formatPct, signalBadgeClass } from "@/utils/api";
import type { CombinedSignal } from "@/hooks/useSignals";

interface Props {
  signal: CombinedSignal;
}

export default function SignalCard({ signal }: Props) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{signal.ticker}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={signalBadgeClass(signal.combined_signal)}>
              {signal.combined_signal}
            </span>
            {signal.conflict && (
              <span className="text-xs text-yellow-600">⚠️ 전략 충돌</span>
            )}
          </div>
        </div>
        {signal.combined_confidence != null && (
          <span className="text-sm font-semibold text-gray-700">
            {(signal.combined_confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <div>
          <span className="font-medium">전략 A</span>{" "}
          <span className={signalBadgeClass(signal.strategy_a_signal ?? "HOLD")}>
            {signal.strategy_a_signal ?? "—"}
          </span>
        </div>
        <div>
          <span className="font-medium">전략 B</span>{" "}
          <span className={signalBadgeClass(signal.strategy_b_signal ?? "HOLD")}>
            {signal.strategy_b_signal ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
