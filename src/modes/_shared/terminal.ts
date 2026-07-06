import './terminal.css';
import type { ModeContext } from '../../core/mode';
import { nowClock } from '../../core/utils';

export interface TerminalShell {
  /** 자동 로그 스트림 컨테이너 (logPusher 대상, 스스로 스크롤) */
  logEl: HTMLElement;
  /** 해커타이퍼 출력 pre (hackerTyper 대상) */
  typerEl: HTMLElement;
  /** 첫 키 입력 시 하단 에디터 패널을 연다 */
  showTyper: () => void;
}

/** Windows Terminal 스타일 크롬. dev / data-engineer가 공유한다. */
export function buildTerminal(ctx: ModeContext, title: string): TerminalShell {
  const el = document.createElement('div');
  el.className = 'term';
  el.innerHTML = `
    <div class="term-bar">
      <span class="term-tab">
        <span class="term-tab-icon" aria-hidden="true">&gt;_</span>
        <span class="term-title"></span>
        <span class="term-tab-x" aria-hidden="true">✕</span>
      </span>
      <span class="term-newtab" aria-hidden="true">+</span>
      <span class="term-spacer"></span>
      <span class="term-clock work-clock"></span>
      <span class="term-winbtns" aria-hidden="true"><i>─</i><i>□</i><i class="term-close">✕</i></span>
    </div>
    <div class="term-log"></div>
    <pre class="term-typer" hidden></pre>
  `;
  el.querySelector('.term-title')!.textContent = title;

  const clock = el.querySelector<HTMLElement>('.term-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);

  const typerEl = el.querySelector<HTMLPreElement>('.term-typer')!;
  return {
    logEl: el.querySelector<HTMLElement>('.term-log')!,
    typerEl,
    showTyper: () => {
      typerEl.hidden = false;
    },
  };
}
