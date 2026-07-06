/** 실존 대형주 + 그럴듯한 기준가(전일 종가). 실시간 API 연동 금지 — 가짜가 정체성이다. */
export interface StockDef {
  name: string;
  base: number; // 전일 종가 (KRW)
}

export const STOCKS: StockDef[] = [
  { name: '삼성전자', base: 79300 },
  { name: 'SK하이닉스', base: 198500 },
  { name: 'LG에너지솔루션', base: 412000 },
  { name: '삼성바이오로직스', base: 812000 },
  { name: '현대차', base: 245500 },
  { name: '기아', base: 128700 },
  { name: '셀트리온', base: 187300 },
  { name: 'POSCO홀딩스', base: 372500 },
  { name: 'NAVER', base: 214000 },
  { name: '카카오', base: 51800 },
  { name: 'KB금융', base: 78900 },
  { name: '신한지주', base: 52400 },
];

export interface IndexDef {
  name: string;
  base: number;
  digits: number;
  jitter: number;
}

export const INDICES: IndexDef[] = [
  { name: 'KOSPI', base: 2731.45, digits: 2, jitter: 1.8 },
  { name: 'KOSDAQ', base: 872.11, digits: 2, jitter: 0.9 },
  { name: 'USD/KRW', base: 1384.5, digits: 1, jitter: 0.8 },
];

/** KRX 호가단위 */
export function tickSize(price: number): number {
  if (price < 2000) return 1;
  if (price < 5000) return 5;
  if (price < 20000) return 10;
  if (price < 50000) return 50;
  if (price < 200000) return 100;
  if (price < 500000) return 500;
  return 1000;
}
