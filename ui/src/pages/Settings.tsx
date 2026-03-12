/**
 * ui/src/pages/Settings.tsx — 전략 설정 및 알림 설정
 */
export default function Settings() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">설정</h1>

      {/* 전략 설정 */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-600">전략 설정</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            전략 블렌드 비율
          </label>
          <p className="text-xs text-gray-400 mb-2">
            0.0 = Strategy A 100% | 1.0 = Strategy B 100%
          </p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            defaultValue="0.5"
            className="w-full accent-brand"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Tournament (A)</span>
            <span>50 / 50</span>
            <span>Debate (B)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              최대 단일 종목 비중 (%)
            </label>
            <input
              type="number"
              defaultValue={20}
              min={1}
              max={100}
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              일손실 서킷브레이커 (%)
            </label>
            <input
              type="number"
              defaultValue={3}
              min={1}
              max={100}
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <button className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
          설정 저장
        </button>
      </div>

      {/* 알림 설정 */}
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
              defaultChecked
              className="w-5 h-5 accent-brand rounded"
            />
          </label>
        ))}

        <button className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
          알림 설정 저장
        </button>
      </div>
    </div>
  );
}
