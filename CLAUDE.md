# 🚀 CLAUDE.md — 에이전트 행동 강령

> **에이전트는 반드시 이 파일을 가장 먼저 읽어야 합니다.**

---

## 📌 프로젝트 개요

- **프로젝트명:** 00_mono
- **목표:** (프로젝트 목표를 여기에 작성)
- **기술 스택:** (사용 기술을 여기에 작성)

---

## ⚡ 자주 쓰는 명령어

```bash
# 개발 서버 실행
npm run dev

# 테스트 실행
npm run test

# 빌드
npm run build

# 린트
npm run lint
```

---

## 🧭 에이전트 행동 규칙

1. **작업 시작 전** `progress.md`를 읽고 현재 상태를 파악한다.
2. **상세 규칙**은 `.agent/` 폴더를 참조한다.
   - 기술 스택 제약: `.agent/tech_stack.md`
   - 코드 컨벤션: `.agent/conventions.md`
   - 재사용 프롬프트: `.agent/prompts.md`
   - 전체 로드맵: `.agent/roadmap.md`
3. **장기 기억**이 필요하면 루트의 `MEMORY.md`를 읽는다.
4. **모든 작업 완료 후** 반드시 `progress.md`를 업데이트한다.
5. **새로운 기술적 결정이나 문제 해결 경험**은 `MEMORY.md`에 기록한다.
6. 멋대로 새 패키지를 설치하지 않는다. `.agent/tech_stack.md`에 명시된 것만 사용한다.

---

## 📂 프로젝트 구조 요약

```
# /00_mono (Root)

├── CLAUDE.md             # 🚀 [Entry] 에이전트 행동 강령 (최우선 진입점)
├── MEMORY.md             # 🧠 [Memory] 기술적 결정 및 문제 해결의 누적 기록
├── progress.md           # 📝 [State] 현재 세션의 할 일 목록 및 진척도
├── README.md             # 프로젝트 소개 문서
├── architecture.md       # 전체 아키텍처 설계 문서
│
├── .agent/               # 📂 [Knowledge] 에이전트 전용 상세 지침서
│   ├── roadmap.md        # 프로젝트 전체 마일스톤 (Long-term Goal)
│   ├── tech_stack.md     # 허용된 라이브러리, 버전, API 제약 (Skills)
│   ├── conventions.md    # 코드 스타일, 테스트 규칙, 배포 규격
│   └── prompts.md        # 특정 작업(Refactoring, UI)을 위한 재사용 프롬프트
│
├── .mcp/                 # 🔌 [Interface] 에이전트 도구 연결 설정
│   └── config.json       # GitHub, DB, 외부 서비스 연동 설정
│
├── docs/                 # 📄 [Reference] 기획서, DB 스키마, 비즈니스 로직
│   ├── AGENTS.md         # 에이전트 종류·역할 분담 정의 (멀티 에이전트 구조)
│   ├── BOOTSTRAP.md      # 시스템/에이전트 최초 부팅 절차 및 초기화 지침
│   ├── HEARTBEAT.md      # 에이전트 생존 신호·상태 모니터링 규격
│   ├── IDENTITY.md       # 에이전트 페르소나·정체성 정의 (이름, 역할, 말투)
│   ├── MEMORY.md         # 메모리 시스템 설계 문서 (루트 MEMORY.md는 실제 기록, 이건 구조 설계)
│   ├── SOUL.md           # 에이전트 핵심 가치관·원칙·행동 철학
│   ├── TOOLS.md          # 에이전트가 사용 가능한 도구 목록 및 사용법
│   ├── USER.md           # 사용자 페르소나·선호도·컨텍스트 정의
│   └── api_spec.md       # API 엔드포인트 상세 설계
│
├── apps/                 # 개별 애플리케이션 (모노레포)
├── extensions/           # 확장 모듈
├── packages/             # 공유 패키지
├── scripts/              # 빌드/배포 스크립트
├── skills/               # 에이전트 스킬 정의
│   └── skills.md
├── src/                  # 💻 [Code] 실제 소스 코드
├── test/                 # 🧪 [Verification] 에이전트가 돌려야 할 테스트 코드
├── ui/                   # UI 관련 코드
└── .env.example          # 🔑 환경 변수 템플릿
```

---

## 🔑 환경 변수

환경 변수는 `.env.example`을 복사하여 `.env`로 사용한다.

---

*Last updated: 2026-03-12*
