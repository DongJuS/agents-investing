/**
 * BUY/SELL/HOLD 시그널 카드 컴포넌트
 */
import { signalBadgeClass } from "@/utils/api";
import type { CombinedSignal } from "@/hooks/useSignals";

interface Props {
  signal: CombinedSignal;
}

export default function SignalCard({ signal }: Props) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{signal.ticker}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={signalBadgeClass(signal.combined_signal)}>
              {signal.combined_signal}
            </span>
            {signal.conflict && (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">전략 충돌</span>
            )}
          </div>
        </div>
        {signal.combined_confidence != null && (
          <span className="text-sm font-bold text-slate-700">
            {(signal.combined_confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <div>
          <span className="font-semibold">전략 A</span>{" "}
          <span className={signalBadgeClass(signal.strategy_a_signal ?? "HOLD")}>
            {signal.strategy_a_signal ?? "—"}
          </span>
        </div>
        <div>
          <span className="font-semibold">전략 B</span>{" "}
          <span className={signalBadgeClass(signal.strategy_b_signal ?? "HOLD")}>
            {signal.strategy_b_signal ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
