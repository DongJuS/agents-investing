/**
 * ui/src/pages/Settings.tsx — 전략/리스크/알림/실거래 전환 설정
 */
import { useEffect, useState } from "react";

import {
  usePortfolioConfig,
  useReadiness,
  useUpdatePortfolioConfig,
  useUpdateTradingMode,
  type PortfolioConfig,
} from "@/hooks/usePortfolio";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences,
} from "@/hooks/useNotifications";

type ConfigForm = Omit<PortfolioConfig, "is_paper_trading">;

export default function Settings() {
  const { data: config, isLoading: configLoading } = usePortfolioConfig();
  const { data: readiness, isLoading: readinessLoading } = useReadiness();
  const { data: pref, isLoading: prefLoading } = useNotificationPreferences();

  const configMutation = useUpdatePortfolioConfig();
  const modeMutation = useUpdateTradingMode();
  const prefMutation = useUpdateNotificationPreferences();

  const [form, setForm] = useState<ConfigForm>({
    strategy_blend_ratio: 0.5,
    max_position_pct: 20,
    daily_loss_limit_pct: 3,
  });
  const [notifForm, setNotifForm] = useState<NotificationPreferences>({
    morning_brief: true,
    trade_alerts: true,
    circuit_breaker: true,
    daily_report: true,
    weekly_summary: true,
  });
  const [confirmationCode, setConfirmationCode] = useState("");

  useEffect(() => {
    if (!config) return;
    setForm({
      strategy_blend_ratio: Number(config.strategy_blend_ratio ?? 0.5),
      max_position_pct: Number(config.max_position_pct ?? 20),
      daily_loss_limit_pct: Number(config.daily_loss_limit_pct ?? 3),
    });
  }, [config]);

  useEffect(() => {
    if (!pref) return;
    setNotifForm(pref);
  }, [pref]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">설정</h1>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600">전략/리스크 설정</h2>
          {config?.is_paper_trading ? (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">PAPER</span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">REAL</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">전략 블렌드 비율</label>
          <p className="text-xs text-gray-400 mb-2">0.0 = Strategy A 100% | 1.0 = Strategy B 100%</p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={form.strategy_blend_ratio}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, strategy_blend_ratio: Number(e.target.value) }))
            }
            className="w-full accent-brand"
            disabled={configLoading}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Tournament (A)</span>
            <span>{Math.round(form.strategy_blend_ratio * 100)}%</span>
            <span>Debate (B)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최대 단일 종목 비중 (%)</label>
            <input
              type="number"
              value={form.max_position_pct}
              min={1}
              max={100}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, max_position_pct: Number(e.target.value) }))
              }
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              disabled={configLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">일손실 서킷브레이커 (%)</label>
            <input
              type="number"
              value={form.daily_loss_limit_pct}
              min={1}
              max={100}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, daily_loss_limit_pct: Number(e.target.value) }))
              }
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              disabled={configLoading}
            />
          </div>
        </div>

        <button
          className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-60"
          disabled={configMutation.isPending}
          onClick={() => configMutation.mutate(form)}
        >
          {configMutation.isPending ? "저장 중..." : "설정 저장"}
        </button>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-600">Telegram 알림 설정</h2>

        {[
          { key: "morning_brief", label: "아침 브리핑 (08:30)" },
          { key: "trade_alerts", label: "거래 체결 알림" },
          { key: "circuit_breaker", label: "서킷브레이커 발동 알림" },
          { key: "daily_report", label: "일일 결산 리포트 (16:30)" },
          { key: "weekly_summary", label: "주간 성과 요약 (금요일 17:00)" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <input
              type="checkbox"
              checked={Boolean(notifForm[key as keyof NotificationPreferences])}
              disabled={prefLoading}
              onChange={(e) =>
                setNotifForm((prev) => ({ ...prev, [key]: e.target.checked }))
              }
              className="w-5 h-5 accent-brand rounded"
            />
          </label>
        ))}

        <button
          className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-60"
          disabled={prefMutation.isPending}
          onClick={() => prefMutation.mutate(notifForm)}
        >
          {prefMutation.isPending ? "저장 중..." : "알림 설정 저장"}
        </button>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-600">실거래 전환</h2>
        <p className="text-xs text-gray-500">
          전환 시 confirmation code + readiness 통과가 모두 필요합니다.
        </p>

        {readinessLoading ? (
          <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <div className="rounded-xl border border-surface-border p-3">
            <p className={`text-sm font-semibold ${readiness?.ready ? "text-positive" : "text-negative"}`}>
              readiness: {readiness?.ready ? "READY" : "NOT READY"}
            </p>
            <div className="mt-2 max-h-44 overflow-y-auto space-y-1">
              {(readiness?.checks ?? []).map((check) => (
                <p key={check.key} className={`text-xs ${check.ok ? "text-gray-600" : "text-red-600"}`}>
                  [{check.severity}] {check.key} - {check.ok ? "ok" : "fail"}
                </p>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
          <input
            type="password"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="REAL_TRADING_CONFIRMATION_CODE"
          />
        </div>

        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
            disabled={modeMutation.isPending}
            onClick={() =>
              modeMutation.mutate({
                is_paper: false,
                confirmation_code: confirmationCode,
              })
            }
          >
            실거래 전환
          </button>
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
            disabled={modeMutation.isPending}
            onClick={() =>
              modeMutation.mutate({
                is_paper: true,
                confirmation_code: confirmationCode,
              })
            }
          >
            페이퍼 복귀
          </button>
        </div>
      </div>
    </div>
  );
}
