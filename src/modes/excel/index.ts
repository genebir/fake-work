import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { comma, nowClock, pick, ri } from '../../core/utils';
import { COLS, FILE_NAME, FORMULAS, ITEMS, ROWS, SHEET_TABS, STATUS_CYCLE } from './data';

function buildSheet(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'xl';
  el.innerHTML = `
    <div class="xl-titlebar">
      <span class="xl-file"></span>
      <span class="xl-autosave">자동 저장 <i>●</i> 켬</span>
      <span class="xl-clock work-clock"></span>
    </div>
    <div class="xl-ribbon">
      <span class="on">홈</span><span>삽입</span><span>페이지 레이아웃</span><span>수식</span>
      <span>데이터</span><span>검토</span><span>보기</span><span>도움말</span>
    </div>
    <div class="xl-formula">
      <span class="xl-namebox">A1</span>
      <span class="xl-fx">fx</span>
      <span class="xl-formula-text"></span>
    </div>
    <div class="xl-grid-wrap"><table class="xl-grid"><thead></thead><tbody></tbody></table></div>
    <div class="xl-sheettabs"></div>
    <div class="xl-status">
      <span class="xl-status-text">준비</span>
      <span class="xl-status-right"></span>
    </div>
  `;
  el.querySelector('.xl-file')!.textContent = FILE_NAME + ' - Excel';

  const thead = el.querySelector('thead')!;
  thead.innerHTML = `<tr><th class="xl-corner"></th>${COLS.map((c) => `<th>${c}</th>`).join('')}</tr>`;

  const tbody = el.querySelector('tbody')!;
  for (let r = 1; r <= ROWS; r++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<th>${r}</th>${COLS.map(() => '<td></td>').join('')}`;
    tbody.appendChild(tr);
  }

  const tabs = el.querySelector('.xl-sheettabs')!;
  tabs.innerHTML = SHEET_TABS.map((t, i) => `<span class="${i === 0 ? 'on' : ''}">${t}</span>`).join('');

  const clock = el.querySelector<HTMLElement>('.xl-clock')!;
  const tickClock = () => (clock.textContent = nowClock());
  tickClock();
  ctx.later(tickClock, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

const excelMode: Mode = {
  meta: {
    id: 'excel',
    name: '사무직 모드',
    icon: '📊',
    description: '「v7_최종_진짜최종.xlsx」가 스스로 집계됩니다. 셀이 움직이는 한 당신은 일하는 중입니다.',
    hint: 'ESC: 복귀 · 시트는 알아서 채워집니다',
  },
  mount(ctx) {
    const el = buildSheet(ctx);
    const cells = [...el.querySelectorAll<HTMLTableCellElement>('tbody td')];
    const namebox = el.querySelector<HTMLElement>('.xl-namebox')!;
    const formulaText = el.querySelector<HTMLElement>('.xl-formula-text')!;
    const statusText = el.querySelector<HTMLElement>('.xl-status-text')!;
    const statusRight = el.querySelector<HTMLElement>('.xl-status-right')!;

    // 활성 셀 이동: 좌→우, 위→아래, 0.4초 간격. 끝까지 차면 초기화 후 반복.
    let i = 0;
    let active: HTMLTableCellElement | null = null;
    ctx.later(() => {
      if (i >= cells.length) {
        i = 0;
        cells.forEach((c) => (c.textContent = ''));
      }
      active?.classList.remove('xl-active');
      const cell = cells[i];
      const row = Math.floor(i / COLS.length); // 0-based
      const col = i % COLS.length;

      cell.classList.add('xl-active');
      active = cell;
      namebox.textContent = `${COLS[col]}${row + 1}`;

      if (col === 0) {
        cell.textContent = ITEMS[row % ITEMS.length];
        cell.classList.remove('xl-num');
        formulaText.textContent = ITEMS[row % ITEMS.length];
      } else {
        const v = ri(3, 9800) * 1000;
        cell.textContent = comma(v);
        cell.classList.add('xl-num');
        formulaText.textContent = pick(FORMULAS).replace(/\{r\}/g, String(row + 1));
      }
      i++;

      // 우측 상태바: 선택 영역 합계 흉내
      statusRight.textContent = `평균: ${comma(ri(80, 4200) * 1000)}   개수: ${i}   합계: ${comma(ri(9000, 99000) * 1000)}`;
    }, 400, true);

    // 상태바 순환: 준비 ↔ 계산 중 N% ↔ 자동 저장 중...
    let s = 0;
    ctx.later(() => {
      s = (s + 1) % STATUS_CYCLE.length;
      statusText.textContent = STATUS_CYCLE[s].replace('{n}', String(ri(12, 97)));
    }, 2600, true);
  },
};

register(excelMode);
