import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { nowClock, pick, ri } from '../../core/utils';
import { MARGIN_NOTES, PAPER, PAPER_AUTHORS, PAPER_TITLE, PDF_NAME } from './data';

function build(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'rs';
  el.innerHTML = `
    <header class="rs-top">
      <span class="rs-file"></span>
      <span class="rs-page-ind">3 / 47</span>
      <span class="rs-zoom">110%</span>
      <span class="rs-clock work-clock"></span>
    </header>
    <div class="rs-canvas">
      <article class="rs-paper">
        <h1 class="rs-title"></h1>
        <p class="rs-authors"></p>
      </article>
    </div>
  `;
  el.querySelector('.rs-file')!.textContent = PDF_NAME;
  el.querySelector('.rs-title')!.textContent = PAPER_TITLE;
  el.querySelector('.rs-authors')!.textContent = PAPER_AUTHORS;

  const paper = el.querySelector<HTMLElement>('.rs-paper')!;
  for (const block of PAPER) {
    if (block.heading) {
      const h = document.createElement('h2');
      h.textContent = block.heading;
      paper.appendChild(h);
    }
    const p = document.createElement('p');
    for (const s of block.sentences) {
      const span = document.createElement('span');
      span.className = 'rs-s';
      span.textContent = s + ' ';
      p.appendChild(span);
    }
    paper.appendChild(p);
  }

  const clock = el.querySelector<HTMLElement>('.rs-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

const researchMode: Mode = {
  meta: {
    id: 'research',
    name: '연구원 모드',
    icon: '📚',
    description: '논문에 형광펜이 저절로 그어집니다. 밑줄이 늘어나는 동안 당신은 문헌 검토 중입니다.',
    hint: 'ESC: 복귀 · 하이라이트는 저절로 그어집니다',
  },
  mount(ctx) {
    const el = build(ctx);
    const canvas = el.querySelector<HTMLElement>('.rs-canvas')!;
    const paper = el.querySelector<HTMLElement>('.rs-paper')!;
    const pageInd = el.querySelector<HTMLElement>('.rs-page-ind')!;
    const sentences = [...el.querySelectorAll<HTMLElement>('.rs-s')];
    const notes: HTMLElement[] = [];

    let i = 0;
    let page = 3;
    ctx.later(() => {
      if (i >= sentences.length) {
        // 완독 — 하이라이트 정리 후 "다음 페이지"부터 다시
        sentences.forEach((s) => s.classList.remove('hl-y', 'hl-g'));
        notes.forEach((n) => n.remove());
        notes.length = 0;
        canvas.scrollTop = 0;
        page = page >= 47 ? 3 : page + 1;
        pageInd.textContent = `${page} / 47`;
        i = 0;
        return;
      }
      const s = sentences[i];
      const roll = Math.random();
      if (roll < 0.55) s.classList.add('hl-y');
      else if (roll < 0.7) s.classList.add('hl-g');

      // 8%: 여백 메모 스티커
      if (roll < 0.08) {
        const note = document.createElement('span');
        note.className = 'rs-note';
        note.textContent = pick(MARGIN_NOTES);
        note.style.top = `${s.offsetTop + ri(-6, 10)}px`;
        note.style.transform = `rotate(${ri(-4, 4)}deg)`;
        paper.appendChild(note);
        notes.push(note);
      }

      // 진행 위치 따라 스크롤 (읽는 속도처럼 부드럽게)
      const target = s.offsetTop - canvas.clientHeight * 0.35;
      if (target > canvas.scrollTop) canvas.scrollTop = target;
      i++;
    }, 900, true);
  },
};

register(researchMode);
