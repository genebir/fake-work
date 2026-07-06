import type { ModeContext } from './mode';

/** 실수 난수 [a, b) */
export const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

/** 정수 난수 [a, b] (inclusive) */
export const ri = (a: number, b: number): number => Math.floor(rnd(a, b + 1));

/** 배열 랜덤 선택 */
export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** 천 단위 콤마 (ko-KR) */
export const comma = (n: number): string => n.toLocaleString('ko-KR');

/** 현재 시각 HH:MM:SS */
export const nowClock = (): string => {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/** prefers-reduced-motion — JS로 만드는 깜빡임 효과는 이 값으로 완화한다 (SSR/테스트 환경 가드 포함) */
export const prefersReducedMotion = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** logPusher 라인: [cssClass, text]. 클래스: lg-ok lg-warn lg-err lg-info lg-dim */
export type LogLine = readonly [cls: string, text: string];

const LOG_CAP = 400;

/**
 * 로그 라인을 랜덤 간격으로 el에 append.
 * - 400줄 초과 시 앞에서 제거 (DOM 노드 캡)
 * - 자동 스크롤
 * - `{t}` 플레이스홀더를 현재 ISO 시각으로 치환
 */
export function logPusher(
  el: HTMLElement,
  lines: LogLine[],
  minMs: number,
  maxMs: number,
  ctx: Pick<ModeContext, 'later'>,
): void {
  const push = () => {
    const [cls, text] = pick(lines);
    const div = document.createElement('div');
    div.className = cls;
    div.textContent = text.replace(/\{t\}/g, new Date().toISOString());
    el.appendChild(div);
    while (el.childElementCount > LOG_CAP) el.firstElementChild!.remove();
    el.scrollTop = el.scrollHeight;
    ctx.later(push, ri(minMs, maxMs));
  };
  ctx.later(push, ri(minMs, maxMs));
}

/**
 * 해커타이퍼: 키 입력마다 소스코드를 2~4자씩 출력 + 깜빡이는 커서.
 * 소스가 끝나면 처음부터 순환. 반환된 핸들러를 ctx.onKey에 연결한다.
 */
export function hackerTyper(
  el: HTMLElement,
  source: string,
  ctx: Pick<ModeContext, 'later'>,
): (e: KeyboardEvent) => void {
  let pos = 0;

  const text = document.createTextNode('');
  const cursor = document.createElement('span');
  cursor.className = 'ht-cursor';
  cursor.textContent = '▋';
  el.append(text, cursor);

  if (!prefersReducedMotion()) {
    ctx.later(() => {
      cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
    }, 530, true);
  }

  return () => {
    const n = ri(2, 4);
    if (pos + n >= source.length) {
      pos = 0;
      text.data = '';
    }
    text.data += source.slice(pos, pos + n);
    pos += n;
    // 타이핑 출력도 캡 유지 (5분 방치 대비)
    if (text.data.length > 20000) text.data = text.data.slice(-10000);
    el.scrollTop = el.scrollHeight;
  };
}
