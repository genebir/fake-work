export interface Kpi {
  key: string;
  label: string;
  sub: string;
  base: number;      // 시작값
  jitter: number;    // 틱당 최대 변동폭 (±)
  min: number;
  max: number;
  fmt: (v: number) => string;
}

export const KPIS: Kpi[] = [
  {
    key: 'dau',
    label: 'DAU',
    sub: '실시간 활성 사용자',
    base: 132480,
    jitter: 420,
    min: 90000,
    max: 220000,
    fmt: (v) => Math.round(v).toLocaleString('ko-KR'),
  },
  {
    key: 'cvr',
    label: 'CVR',
    sub: '구매 전환율',
    base: 3.42,
    jitter: 0.06,
    min: 1.2,
    max: 6.5,
    fmt: (v) => v.toFixed(2) + '%',
  },
  {
    key: 'roas',
    label: 'ROAS',
    sub: '광고 수익률 (7일)',
    base: 412,
    jitter: 6,
    min: 180,
    max: 720,
    fmt: (v) => Math.round(v) + '%',
  },
  {
    key: 'spend',
    label: '광고비 소진',
    sub: '일 예산 대비',
    base: 62.8,
    jitter: 0.4, // 소진율은 사실상 단조 증가 (아래에서 양수 편향 적용)
    min: 0,
    max: 99.9,
    fmt: (v) => v.toFixed(1) + '%',
  },
];

export const DASH_TITLE = '퍼포먼스 대시보드 — 7월 통합 캠페인';
export const CHART_LABEL = '분당 유입 세션';
