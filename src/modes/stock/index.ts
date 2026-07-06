import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { comma, nowClock, pick, ri, rnd } from '../../core/utils';
import { INDICES, STOCKS, tickSize } from './data';

interface Row {
  price: number;
  volume: number;
  tr: HTMLTableRowElement;
}

function buildHts(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'st';
  el.innerHTML = `
    <header class="st-top">
      <span class="st-brand">열일증권 HTS</span>
      <div class="st-indices"></div>
      <span class="st-live">● 실시간</span>
      <span class="st-clock work-clock"></span>
    </header>
    <div class="st-table-wrap">
      <table class="st-table">
        <thead>
          <tr><th>종목명</th><th>현재가</th><th>전일대비</th><th>등락률</th><th>거래량</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <footer class="st-foot">
      <span>[0781] 관심종목 — 실전투자</span>
      <span>조회는 연속 조회됩니다. 데이터는 20분 지연이 아니라 완전한 허구입니다.</span>
    </footer>
  `;

  const idxWrap = el.querySelector<HTMLElement>('.st-indices')!;
  for (const ix of INDICES) {
    const s = document.createElement('span');
    s.className = 'st-index';
    s.innerHTML = `<b></b> <em class="st-idx-val"></em> <i class="st-idx-diff"></i>`;
    s.querySelector('b')!.textContent = ix.name;
    idxWrap.appendChild(s);
  }

  const clock = el.querySelector<HTMLElement>('.st-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

const stockMode: Mode = {
  meta: {
    id: 'stock',
    name: '트레이더 모드',
    icon: '📉',
    description: '호가창이 쉴 새 없이 깜빡이는 다크 HTS. 표정만 심각하면 자산 운용 중으로 보입니다.',
    hint: 'ESC: 복귀 · 시세는 전부 허구입니다',
  },
  mount(ctx) {
    const el = buildHts(ctx);
    const tbody = el.querySelector('tbody')!;

    // 종목 테이블 구성
    const rows: Row[] = STOCKS.map((s) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="st-name"></td><td class="st-price"></td><td class="st-diff"></td><td class="st-rate"></td><td class="st-vol"></td>`;
      tr.querySelector('.st-name')!.textContent = s.name;
      tbody.appendChild(tr);
      return { price: s.base, volume: ri(120000, 9800000), tr };
    });

    const paint = (i: number, flash: boolean) => {
      const s = STOCKS[i];
      const r = rows[i];
      const diff = r.price - s.base;
      const rate = (diff / s.base) * 100;
      const cls = diff > 0 ? 'st-up' : diff < 0 ? 'st-down' : 'st-flat';
      const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : '';

      const price = r.tr.querySelector<HTMLElement>('.st-price')!;
      const diffEl = r.tr.querySelector<HTMLElement>('.st-diff')!;
      const rateEl = r.tr.querySelector<HTMLElement>('.st-rate')!;
      const volEl = r.tr.querySelector<HTMLElement>('.st-vol')!;

      price.textContent = comma(r.price);
      diffEl.textContent = diff === 0 ? '-' : `${sign} ${comma(Math.abs(diff))}`;
      rateEl.textContent = `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`;
      for (const c of [price, diffEl, rateEl]) c.className = `${c.className.split(' ')[0]} ${cls}`;
      volEl.textContent = comma(r.volume);

      if (flash) {
        const fcls = diff >= 0 ? 'st-flash-up' : 'st-flash-down';
        price.classList.add(fcls);
        ctx.later(() => price.classList.remove(fcls), 350);
      }
    };
    rows.forEach((_, i) => paint(i, false));

    // 0.26초마다 랜덤 종목 1개 체결
    ctx.later(() => {
      const i = ri(0, rows.length - 1);
      const r = rows[i];
      const step = tickSize(r.price);
      const move = step * ri(1, 3) * (Math.random() < 0.5 ? -1 : 1);
      // 기준가 대비 ±15% 밴드 유지 (상한가 흉내는 과함)
      const next = Math.max(STOCKS[i].base * 0.85, Math.min(STOCKS[i].base * 1.15, r.price + move));
      r.price = Math.round(next / step) * step;
      r.volume += ri(800, 92000);
      paint(i, true);
    }, 260, true);

    // 1.2초마다 지수 미세 변동
    const idxVals = INDICES.map((ix) => ix.base);
    const idxEls = [...el.querySelectorAll('.st-index')];
    const paintIdx = () => {
      INDICES.forEach((ix, i) => {
        const diff = idxVals[i] - ix.base;
        const up = diff >= 0;
        const valEl = idxEls[i].querySelector<HTMLElement>('.st-idx-val')!;
        const diffEl = idxEls[i].querySelector<HTMLElement>('.st-idx-diff')!;
        valEl.textContent = idxVals[i].toLocaleString('ko-KR', {
          minimumFractionDigits: ix.digits,
          maximumFractionDigits: ix.digits,
        });
        valEl.className = `st-idx-val ${up ? 'st-up' : 'st-down'}`;
        diffEl.textContent = `${up ? '▲' : '▼'} ${Math.abs(diff).toFixed(ix.digits)}`;
        diffEl.className = `st-idx-diff ${up ? 'st-up' : 'st-down'}`;
      });
    };
    paintIdx();
    ctx.later(() => {
      const i = ri(0, INDICES.length - 1);
      idxVals[i] += rnd(-INDICES[i].jitter, INDICES[i].jitter);
      paintIdx();
    }, 1200, true);

    // 가끔 하단 틱커 문구 교체
    const foot = el.querySelector<HTMLElement>('.st-foot span:last-child')!;
    const TICKER = [
      '조회는 연속 조회됩니다. 데이터는 20분 지연이 아니라 완전한 허구입니다.',
      '금일 미수동결계좌 지정 안내는 없습니다. 애초에 계좌가 없습니다.',
      '투자의 책임은 본인에게 있으며, 본 화면의 손익은 누구의 것도 아닙니다.',
    ];
    ctx.later(() => (foot.textContent = pick(TICKER)), 9000, true);
  },
};

register(stockMode);
