# 🧠 MEMORY.md — 기술적 결정 및 문제 해결 누적 기록

> 이 파일은 에이전트의 장기 기억입니다.
> 세션이 새로 시작되어도 같은 실수를 반복하지 않기 위해 여기에 기록합니다.

---

## 📌 기술적 결정 사항

### 2026-03-12 — 페이퍼 트레이딩 기본값 설정
- **결정:** `KIS_IS_PAPER_TRADING=true`를 기본값으로 설정. 실거래는 명시적 플래그 변경 + 대시보드 확인 단계 필요.
- **이유:** 개발/테스트 중 실수로 실제 자금이 움직이는 것을 방지. 안전이 최우선.

### 2026-03-12 — LangGraph 오케스트레이션 채택
- **결정:** OrchestratorAgent에 LangGraph + PostgreSQL AsyncPostgresSaver 사용.
- **이유:** 내장 상태 영속화, 재시도 로직, Claude Agent SDK 통합. 워크플로우 상태 기계를 직접 구현하는 것보다 효율적.

### 2026-03-12 — FinanceDataReader 주 데이터 소스 채택
- **결정:** KRX EOD 데이터는 `FinanceDataReader (fdr)`를 주 소스, KRX 직접 API를 보조로 사용.
- **이유:** fdr은 활발히 유지되고, API 키 없이 무료로 KRX 데이터에 접근 가능. KIS WebSocket은 장중 실시간 틱만 담당.

### 2026-03-12 — 3종 LLM 멀티 운용 결정
- **결정:** Claude CLI, OpenAI GPT-4o (OAuth), Gemini CLI를 동시에 운용.
- **이유:** 단일 LLM 의존 위험 분산, Strategy A 토너먼트에서 다양한 분석 관점 확보, Strategy B 토론에서 실질적인 이견 유도.
- **Strategy A 구성:** Claude 2개 + GPT 2개 + Gemini 1개 (총 5 인스턴스)
- **Strategy B 역할:** Proposer(Claude) → Challenger1(GPT) + Challenger2(Gemini) → Synthesizer(Claude)

### 2026-03-12 — 알림 채널 Telegram 단일화
- **결정:** KakaoTalk 대신 Telegram Bot API 사용.
- **이유:** Telegram Bot API가 더 개방적이고, 개인 개발자 접근이 쉬우며, `python-telegram-bot` 라이브러리가 안정적.

---

## 🐛 문제 해결 기록

### 2026-03-12 — KRX 휴장일 미처리 주의
- **문제:** FinanceDataReader는 한국 공휴일/임시 휴장일을 자동으로 제외하지 않음.
- **원인:** fdr의 캘린더 데이터가 불완전함.
- **해결:** 부팅 시 `scripts/fetch_krx_holidays.py`로 KRX 공식 휴장일 목록을 가져와 Redis `krx:holidays:{year}`에 저장. CollectorAgent는 매 작업 전에 이 키를 확인.

### 2026-03-12 — KIS OAuth 토큰 만료 주의
- **문제:** KIS OAuth 토큰은 24시간 후 만료됨. 갱신하지 않으면 모든 트레이딩 API 호출이 조용히 실패함.
- **해결:** PortfolioManagerAgent가 매일 06:00 KST에 토큰을 갱신, Redis `kis:oauth_token`에 TTL 23시간으로 저장. 토큰 만료 1시간 전 NotifierAgent에 알림 발송.

---

## 🏗️ 아키텍처 변경 이력

### 2026-03-12 — 초기 아키텍처 확정
- 5개 에이전트 구조 (Collector, Predictor, PortfolioManager, Notifier, Orchestrator)
- Strategy A (Tournament) + Strategy B (Consensus) 동시 운용
- Redis Pub/Sub 기반 에이전트 간 통신
- 메모리 3-tier: Redis (Hot) / PostgreSQL (Warm) / PostgreSQL Archive (Cold)

---

## ⚠️ 주의 사항 (Gotchas)

1. **`kis_place_order`는 PortfolioManagerAgent만 호출 가능.** 다른 에이전트가 주문 API를 직접 호출하면 안 됨.
2. **서킷브레이커(-3% 일손실)는 절대 LLM이 오버라이드 불가.** 코드에서 하드코딩된 체크가 먼저 실행됨.
3. **데이터 신선도 확인.** Predictor는 30분 이상 오래된 장중 데이터로 예측하면 안 됨.
4. **KIS 페이퍼와 실거래 엔드포인트가 다름.** `openapivts` (페이퍼) vs `openapi` (실거래), `tr_id`도 다름.
5. **fdr은 EOD만.** 장중 실시간 데이터는 반드시 KIS WebSocket 사용.

---

*Last updated: 2026-03-12*
