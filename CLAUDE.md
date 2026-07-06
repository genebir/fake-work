# CLAUDE.md — 일하는척 (fake-work)

> 업종별 "일하는 척" 화면을 시뮬레이션하는 웹앱.
> 이 문서는 Claude Code가 프로젝트를 처음부터 만들어가기 위한 단일 기준 문서(Single Source of Truth)다.
> 작업 시작 전 반드시 이 문서를 읽고, 스펙과 다르게 구현해야 할 경우 먼저 이 문서를 수정한 뒤 코드를 작성한다.

---

## 1. 프로젝트 개요

- **이름**: 일하는척 (repo: `fake-work`)
- **한 줄 정의**: 업종을 선택하면 해당 직군의 "바빠 보이는" 화면을 풀스크린으로 재생하는 정적 웹앱
- **핵심 컨셉**: 런처 화면 자체도 위장이다. 첫 화면을 촌스러운 사내 그룹웨어(레거시 인트라넷)처럼 디자인해서, 모드를 고르는 순간조차 업무 화면처럼 보이게 한다.
- **타깃**: 사무실에서 잠깐 숨 돌리고 싶은 직장인. 유머 프로젝트이므로 카피/디테일에 위트가 필수.
- **배포**: 정적 호스팅 (GitHub Pages). 서버/DB 없음.

## 2. 기술 스택 & 원칙

| 항목 | 선택 | 이유 |
|---|---|---|
| 빌드 | Vite | 가볍고 빠름, GH Pages 배포 간단 |
| 언어 | TypeScript (vanilla, 프레임워크 없음) | 앱 규모 대비 React는 과함. DOM 직접 제어가 오히려 단순 |
| 스타일 | 일반 CSS (CSS 변수 기반 토큰) | 모드별 룩이 완전히 달라서 유틸리티 CSS 이점 적음 |
| 테스트 | Vitest (유틸 함수만) | 시각 요소는 수동 검증, 순수 함수만 테스트 |
| 배포 | GitHub Actions → GitHub Pages | push 시 자동 배포 |

**원칙**
1. 외부 런타임 의존성 0개를 유지한다 (devDependencies만 허용). 폰트도 시스템 폰트 스택 사용.
2. 모드 추가 = 파일 1개 추가로 끝나야 한다 (Registry 패턴, §4).
3. 모든 화면은 "진짜 같아 보이는 것"이 최우선. 애니메이션 속도, 로그 문구, 숫자 포맷의 리얼함이 곧 품질이다.
4. 성능: 타이머는 모드 진입 시 생성, 이탈 시 전부 해제. 메모리 누수 금지 (DOM 노드 캡 유지).
5. 접근성 최소선: 키보드만으로 모드 선택/실행/복귀 가능, `prefers-reduced-motion` 시 깜빡임 효과 완화.

## 3. 디렉토리 구조

```
fake-work/
├── CLAUDE.md                  # 이 문서
├── index.html
├── vite.config.ts
├── src/
│   ├── main.ts                # 부트스트랩: 런처 렌더 + 라우팅
│   ├── core/
│   │   ├── mode.ts            # Mode 인터페이스 + ModeContext
│   │   ├── registry.ts        # 모드 등록/조회
│   │   ├── scheduler.ts       # later()/clearAll() 타이머 관리
│   │   └── utils.ts           # rnd, ri, pick, comma, clock 등
│   ├── launcher/
│   │   ├── launcher.ts        # 그룹웨어 위장 런처 UI
│   │   └── launcher.css
│   ├── modes/
│   │   ├── dev/               # 모드당 폴더 1개: index.ts + style.css + data.ts
│   │   ├── data-engineer/
│   │   ├── excel/
│   │   ├── marketing/
│   │   ├── stock/
│   │   └── report/
│   └── styles/
│       ├── tokens.css         # 전역 CSS 변수
│       └── base.css           # 리셋 + 공통 컴포넌트(hint 토스트 등)
└── tests/
    └── utils.test.ts
```

## 4. 핵심 아키텍처

### 4.1 Mode 인터페이스

모든 모드는 아래 인터페이스를 구현하고 registry에 자기 자신을 등록한다.

```ts
// src/core/mode.ts
export interface ModeMeta {
  id: string;           // 'dev', 'excel' ...
  name: string;         // '개발자 모드'
  icon: string;         // 이모지 1개
  description: string;  // 런처 카드에 표시할 1~2문장 (위트 필수)
  hint: string;         // 실행 직후 토스트 문구 (예: 'ESC: 복귀 · 아무 키: 코드 타이핑')
}

export interface ModeContext {
  root: HTMLElement;                       // 모드가 렌더할 컨테이너
  later: (fn: () => void, ms: number, repeat?: boolean) => number;  // 자동 해제되는 타이머
  onKey: (handler: (e: KeyboardEvent) => void) => void;            // ESC 제외 키 입력 구독
}

export interface Mode {
  meta: ModeMeta;
  mount(ctx: ModeContext): void;   // 진입: DOM 생성 + 타이머 시작
  unmount?(): void;                // 이탈: later로 만든 타이머는 자동 해제, 그 외 정리만
}
```

### 4.2 Registry

```ts
// src/core/registry.ts
const modes = new Map<string, Mode>();
export const register = (m: Mode) => modes.set(m.meta.id, m);
export const all = () => [...modes.values()];
export const get = (id: string) => modes.get(id);
```

- 각 모드 폴더의 `index.ts` 마지막 줄에서 `register(myMode)` 호출
- `main.ts`에서 `import './modes/dev'` 식으로 side-effect import → 등록 완료
- **모드 추가 절차**: 폴더 생성 → Mode 구현 → main.ts에 import 1줄. 끝.

### 4.3 전역 동작

- `ESC`: 어느 모드에서든 즉시 런처 복귀 (긴급 탈출). 이 키는 core가 선점하며 모드에 전달하지 않는다.
- URL 해시 라우팅: `#/dev` 로 직접 진입 가능 (새로고침해도 모드 유지 → 걸릴 위험 감소)
- 힌트 토스트: 모드 진입 시 4초 표시 후 페이드아웃
- 모든 워크스크린 우상단에 실시간 시계 (리얼함 담당)

## 5. 공통 유틸 스펙 (`core/utils.ts`)

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `rnd` | `(a, b) => number` | 실수 난수 |
| `ri` | `(a, b) => number` | 정수 난수 (inclusive) |
| `pick` | `<T>(arr: T[]) => T` | 배열 랜덤 선택 |
| `comma` | `(n: number) => string` | 천 단위 콤마 (ko-KR) |
| `nowClock` | `() => string` | `HH:MM:SS` |
| `logPusher` | `(el, lines, minMs, maxMs, ctx)` | 로그 라인을 랜덤 간격으로 append. 400줄 초과 시 앞에서 제거, 자동 스크롤. `{t}` 플레이스홀더를 현재 ISO 시각으로 치환 |
| `hackerTyper` | `(el, source, ctx) => (keyEvent) => void` | 키 입력마다 소스코드 2~4자씩 출력 + 깜빡이는 커서. 소스 끝나면 처음부터 순환 |

`logPusher`의 라인 형식: `[cssClass, text]` 튜플 배열. 클래스: `lg-ok`(초록) `lg-warn`(노랑) `lg-err`(빨강) `lg-info`(파랑) `lg-dim`(회색).

## 6. 런처 스펙 (그룹웨어 위장)

- **디자인 방향**: 2010년대 한국 사내 인트라넷. 남색 상단바(`#2b4c7e`), 회색빛 배경, 각진 카드, 맑은 고딕. 예쁘면 안 된다. "촌스러움이 곧 위장".
- 상단바: `(주)열일 통합업무포털  Work Simulation System v2.4.1` / 우측 `김대리 님 | 근태: 정상출근 09:00 | 로그아웃`
- 공지 롤링 바: 위트 있는 가짜 공지 3~5개 순환 (예: "모니터를 응시하는 표정 관리는 본 시스템이 지원하지 않습니다. 미간을 살짝 찌푸려 주세요.")
- 모드 카드 그리드: registry의 `all()`을 순회하며 렌더 (아이콘/이름/설명/실행 버튼)
- 하단 각주: 면책 문구 스타일의 유머 ("본 시스템은 실제 업무 성과를 생성하지 않습니다" 등) + 단축키 안내

## 7. 모드별 상세 스펙

### 7.1 `dev` — 개발자 모드
- **화면**: macOS 스타일 터미널 (신호등 3개, 타이틀 `giseung@prod-svc: ~/workspace/...`), 다크 (`#0d1117`)
- **자동**: npm build / vitest / git rebase / docker compose / kubectl logs 가 섞인 로그 스트림 (0.35~1.4초 간격). WARN을 10~15% 섞어야 리얼함
- **인터랙션**: 아무 키 → 해커타이퍼. 소스는 실제로 동작할 법한 Python 함수 (정산 배치 처리 등 30줄 내외)
- **디테일**: 로그 안 타임스탬프는 실제 현재 시각

### 7.2 `data-engineer` — 데이터 엔지니어 모드
- **화면**: dev와 같은 터미널 셸, 타이틀 `airflow-worker-3 | dag: dw_daily_batch`
- **자동**: Airflow task 로그 + Debezium binlog 스트리밍 + Kafka consumer lag + dbt run/test + Spark stage + S3 sink + Vertica vkconfig microbatch. 데이터 품질 체크(row count diff ✓) 같은 디테일 포함
- **인터랙션**: 해커타이퍼 동일 적용

### 7.3 `excel` — 사무직 모드
- **화면**: Excel 모사. 초록 리본바(`#107c41`), 수식바, A~J열 × 26행 그리드, 하단 상태바
- **파일명**: `2026년_상반기_실적집계_v7_최종_진짜최종.xlsx` (제목이 개그의 절반)
- **자동**:
  - 활성 셀이 좌→우, 위→아래로 이동하며 0.4초 간격으로 값 채움 (A열은 품목 텍스트, 나머지는 콤마 숫자)
  - 수식바에 `=SUMIFS(...)`, `=VLOOKUP(...)`, `=XLOOKUP(...)` 랜덤 표시
  - 상태바: "준비" ↔ "계산 중(4개 프로세서): N%" ↔ "자동 저장 중..." 순환
  - 그리드 끝까지 차면 초기화 후 반복

### 7.4 `marketing` — 마케터 모드
- **화면**: 밝은 SaaS 대시보드. KPI 카드 4개 (DAU / CVR / ROAS / 광고비 소진) + canvas 라인차트
- **자동**: 0.9초마다 KPI 미세 변동(tabular-nums 필수), 차트는 우측으로 흐르는 시계열 (push/shift)
- **디테일**: `● LIVE` 배지 + 시계, 등락 화살표 색상 (▲빨강/▼파랑 — 한국 관례)

### 7.5 `stock` — 금융/트레이더 모드
- **화면**: 다크 HTS. 상단 지수바 (KOSPI/KOSDAQ/USDKRW), 종목 테이블 12행
- **자동**:
  - 0.26초마다 랜덤 종목 1개 체결: 호가단위 기반 가격 변동 + 셀 플래시 (상승 빨강/하락 파랑 배경 0.35초)
  - 1.2초마다 지수 미세 변동
- **데이터**: 실존 대형주 이름 + 그럴듯한 기준가 하드코딩. 실시간 API 연동 금지 (이 프로젝트의 정체성은 가짜)

### 7.6 `report` — 기획자/보고서 모드
- **화면**: Word 모사. 파란 툴바(`#2b579a`, "자동 저장됨"), 회색 배경 위 A4 흰 페이지
- **자동**: 「2026년 하반기 사업 추진 계획(안)」이 60ms 간격 1~3자씩 자동 타이핑. 커서 깜빡임
- **콘텐츠**: Ⅰ.추진 배경 → Ⅱ.추진 방향 → Ⅲ.세부 추진 과제 → Ⅳ.기대 효과. 문체는 완벽한 보고서체 ("~하고자 함", "~로 판단됨")

### 7.7 추가 후보 (백로그, 구현은 로드맵 Step 6 이후)
- `designer`: Figma풍 캔버스 + 레이어 패널 + "에셋 내보내는 중..." 진행바
- `cs`: 티켓 큐가 쌓이고 처리되는 헬프데스크 화면
- `pm`: Jira풍 칸반보드에서 카드가 저절로 옮겨짐
- `research`: 논문 PDF 뷰어 + 하이라이트가 저절로 그어짐

## 8. 구현 로드맵

각 Step 완료 시 커밋 1개 이상. 커밋 메시지는 `feat(step-N): ...` 형식.
**Step을 건너뛰지 말 것. 각 Step의 완료 조건(DoD)을 만족한 뒤 다음으로 진행.**

- [x] **Step 0 — 스캐폴딩**: Vite + TS 프로젝트 생성, 디렉토리 구조(§3) 생성, tokens.css에 전역 변수 정의, GH Actions 배포 워크플로 작성
  - DoD: `npm run dev` 동작, 빈 페이지에 "fake-work" 렌더
- [x] **Step 1 — 코어**: mode.ts / registry.ts / scheduler.ts / utils.ts 구현 + utils 단위 테스트
  - DoD: `npm test` 통과. later()로 만든 타이머가 모드 전환 시 전부 해제됨을 테스트로 검증
- [ ] **Step 2 — 런처 + 라우팅**: 그룹웨어 런처(§6), 해시 라우팅, ESC 복귀, 힌트 토스트
  - DoD: 더미 모드 1개 등록 → 카드 클릭 진입 → ESC 복귀 → 타이머 누수 없음 (콘솔 확인)
- [ ] **Step 3 — 터미널 계열**: logPusher + hackerTyper 유틸, `dev` / `data-engineer` 모드
  - DoD: 로그 400줄 캡 동작, 키 입력 타이핑, 자동 스크롤 유지
- [ ] **Step 4 — 오피스 계열**: `excel` / `report` 모드
  - DoD: 엑셀 그리드 순환 채움, 보고서 자동 타이핑 완주
- [ ] **Step 5 — 대시보드 계열**: `marketing` / `stock` 모드
  - DoD: 차트 리사이즈 대응, 종목 플래시 정상 동작
- [ ] **Step 6 — 폴리시**: 반응형(모바일에서 런처만이라도 정상), prefers-reduced-motion 대응, README 작성, GH Pages 배포 확인
  - DoD: Lighthouse 접근성 90+, 실배포 URL에서 전 모드 동작

## 9. 작업 지침 (Claude Code용)

1. **문서 우선**: 스펙 변경이 필요하면 CLAUDE.md를 먼저 수정하고 코드에 반영한다. 문서와 코드가 다르면 버그다.
2. **한 Step = 한 세션 단위**로 작업한다. Step 시작 시 해당 섹션을 다시 읽는다.
3. 카피(로그 문구, 공지, 보고서 본문)는 데이터 파일(`data.ts`)로 분리한다. 코드와 문구를 섞지 않는다.
4. 새 모드를 만들 때는 기존 모드 하나를 열어 구조를 그대로 따른다. 창의성은 화면 내용에 쓰고, 구조에는 쓰지 않는다.
5. 타이머는 반드시 `ctx.later()`만 사용한다. `setInterval` 직접 호출 금지 (누수 방지).
6. 색상/폰트 하드코딩 금지, `tokens.css` 변수 사용. 단, 모드 고유 색(엑셀 초록 등)은 모드 CSS 파일 상단에 지역 변수로 선언.
7. 유머 카피를 수정할 때는 "실제 회사에서 봤을 법한가?"를 기준으로 한다. 과장보다 디테일이 웃기다.

## 10. 검증 체크리스트 (모드 공통)

- [ ] 진입 → ESC 복귀를 10회 반복해도 타이머/리스너 누수 없음
- [ ] 5분 방치해도 DOM 노드 수가 일정 수준에서 유지됨
- [ ] 전체화면(F11)에서 레이아웃 깨지지 않음
- [ ] 우상단 시계가 실제 시각과 일치
- [ ] 멀리서 봤을 때 진짜 업무 화면으로 보임 (최종 판정 기준)

---

## 부록 A. 프로토타입

단일 HTML 프로토타입(`일하는척.html`)이 이미 존재한다. 6개 모드의 룩앤필, 로그 문구, 타이밍 값(간격 ms)은 프로토타입을 정답지로 삼아 이식한다. 단, 아키텍처는 이식하지 않는다 — 프로토타입은 전역 스코프 스파게티이므로 §4 구조로 재작성한다.

## 부록 B. 디자인 토큰 (tokens.css 초기값)

```css
:root {
  /* 그룹웨어 (런처) */
  --gw-navy: #2b4c7e;
  --gw-blue: #1b5faa;
  --gw-bg: #eef1f5;
  --gw-border: #c8d1dc;
  --gw-text: #2c3440;
  --gw-sub: #6b7684;
  /* 터미널 */
  --term-bg: #0d1117;
  --term-text: #c9d1d9;
  --term-ok: #3fb950;
  --term-warn: #d29922;
  --term-err: #f85149;
  --term-info: #58a6ff;
  --term-dim: #8b949e;
  /* 시장 색상 (한국 관례) */
  --up: #d60000;
  --down: #0051c7;
  /* 폰트 */
  --font-sans: "Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", sans-serif;
  --font-mono: "D2Coding", Consolas, Menlo, monospace;
}
```
