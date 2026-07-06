import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { nowClock, pick, ri } from '../../core/utils';
import { ASSIGNEES, BOARD_NAME, CARD_TITLES, COLUMNS, SPRINT_LABEL } from './data';

const DONE_CAP = 8;

function build(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'pm';
  el.innerHTML = `
    <header class="pm-top">
      <b>${BOARD_NAME}</b>
      <span class="pm-sprint">${SPRINT_LABEL}</span>
      <span class="pm-avatars" aria-hidden="true"></span>
      <span class="pm-clock work-clock"></span>
    </header>
    <div class="pm-board"></div>
  `;
  el.querySelector('.pm-avatars')!.innerHTML = ASSIGNEES.slice(0, 4)
    .map((a) => `<i style="background:${a.color}">${a.initial}</i>`)
    .join('');

  const board = el.querySelector<HTMLElement>('.pm-board')!;
  for (const name of COLUMNS) {
    const col = document.createElement('section');
    col.className = 'pm-col';
    col.innerHTML = `<h3><span></span><i class="pm-count">0</i></h3><div class="pm-cards"></div>`;
    col.querySelector('span')!.textContent = name;
    board.appendChild(col);
  }

  const clock = el.querySelector<HTMLElement>('.pm-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

const pmMode: Mode = {
  meta: {
    id: 'pm',
    name: '기획자 모드',
    icon: '📋',
    description: '칸반 카드가 저절로 오른쪽으로 흘러갑니다. 가끔 리뷰에서 반려되는 것까지 완벽하게 현실적입니다.',
    hint: 'ESC: 복귀 · 카드는 알아서 흘러갑니다',
  },
  mount(ctx) {
    const el = build(ctx);
    const cols = [...el.querySelectorAll<HTMLElement>('.pm-col .pm-cards')];
    const counts = [...el.querySelectorAll<HTMLElement>('.pm-count')];
    let cardNo = ri(2410, 2470);

    const refreshCounts = () =>
      cols.forEach((c, i) => (counts[i].textContent = String(c.childElementCount)));

    const makeCard = () => {
      const a = pick(ASSIGNEES);
      const card = document.createElement('div');
      card.className = 'pm-card';
      card.innerHTML = `
        <p class="pm-card-title"></p>
        <div class="pm-card-meta">
          <span class="pm-key">PROJ-${cardNo++}</span>
          <span class="pm-pt">${pick([1, 2, 3, 5, 8, 13])}</span>
          <i class="pm-ava" style="background:${a.color}">${a.initial}</i>
        </div>
      `;
      card.querySelector('.pm-card-title')!.textContent = pick(CARD_TITLES);
      return card;
    };

    // 초기 보드
    const seed = [4, 3, 2, 4];
    seed.forEach((n, i) => {
      for (let k = 0; k < n; k++) cols[i].appendChild(makeCard());
    });
    refreshCounts();

    const highlight = (card: HTMLElement) => {
      card.classList.add('pm-moved');
      ctx.later(() => card.classList.remove('pm-moved'), 700);
    };

    // 카드 이동 (2.8초): 오른쪽으로, 12%는 리뷰→진행 중 반려
    ctx.later(() => {
      const reject = Math.random() < 0.12 && cols[2].childElementCount > 0;
      if (reject) {
        const card = cols[2].children[ri(0, cols[2].childElementCount - 1)] as HTMLElement;
        cols[1].prepend(card);
        highlight(card);
      } else {
        // 이동 가능한 열 중 카드가 밀려 있는 곳 우선
        const from = [0, 1, 2]
          .filter((i) => cols[i].childElementCount > 0)
          .sort((a, b) => cols[b].childElementCount - cols[a].childElementCount)[0];
        if (from !== undefined) {
          const card = cols[from].children[ri(0, cols[from].childElementCount - 1)] as HTMLElement;
          cols[from + 1].prepend(card);
          highlight(card);
          while (cols[3].childElementCount > DONE_CAP) cols[3].lastElementChild!.remove();
        }
      }
      refreshCounts();
    }, 2800, true);

    // 새 카드 유입 (6~11초) — 할 일은 마르지 않는다
    const inflow = () => {
      const card = makeCard();
      cols[0].prepend(card);
      highlight(card);
      refreshCounts();
      ctx.later(inflow, ri(6000, 11000));
    };
    ctx.later(inflow, ri(6000, 11000));
  },
};

register(pmMode);
