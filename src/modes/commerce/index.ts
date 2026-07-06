import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { comma, nowClock, pick, ri } from '../../core/utils';
import { ACTIVE_MENU, BUYERS, MENUS, ORDER_FLOW, PAY_METHODS, PRODUCTS, SHOP_NAME } from './data';

type OrderStatus = (typeof ORDER_FLOW)[number];

interface Order {
  status: OrderStatus;
  tr: HTMLTableRowElement;
}

const ROW_CAP = 24;
const CHIP_KEYS = [...ORDER_FLOW, '취소', '반품'] as const;

function todayStamp(): string {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

function build(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'cm';
  el.innerHTML = `
    <header class="cm-top">
      <b class="cm-logo">cafe24</b>
      <span class="cm-shop"></span>
      <span class="cm-bell">🔔<i class="cm-badge">0</i></span>
      <span class="cm-plan">PRO</span>
      <span class="cm-clock work-clock"></span>
    </header>
    <div class="cm-body">
      <nav class="cm-side"><ul></ul></nav>
      <main class="cm-main">
        <h1>주문 대시보드</h1>
        <div class="cm-chips"></div>
        <div class="cm-cards">
          <div class="cm-card"><span>오늘 매출액</span><i data-c="sales">0</i></div>
          <div class="cm-card"><span>오늘 주문수</span><i data-c="orders">0</i></div>
          <div class="cm-card"><span>오늘 방문자</span><i data-c="visitors">0</i></div>
          <div class="cm-card"><span>실시간 접속자</span><i data-c="live">0</i></div>
        </div>
        <h2>신규 주문 <em class="cm-live-dot">●</em></h2>
        <div class="cm-table-wrap">
          <table class="cm-table">
            <thead><tr><th>주문번호</th><th>상품</th><th>구매자</th><th>결제수단</th><th>금액</th><th>상태</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </main>
    </div>
  `;
  el.querySelector('.cm-shop')!.textContent = SHOP_NAME;

  const menu = el.querySelector('.cm-side ul')!;
  for (const m of MENUS) {
    const li = document.createElement('li');
    li.textContent = m;
    if (m === ACTIVE_MENU) li.className = 'on';
    menu.appendChild(li);
  }

  const chips = el.querySelector<HTMLElement>('.cm-chips')!;
  for (const k of CHIP_KEYS) {
    const chip = document.createElement('div');
    chip.className = 'cm-chip';
    chip.innerHTML = `<i data-chip="${k}">0</i><span></span>`;
    chip.querySelector('span')!.textContent = k;
    chips.appendChild(chip);
  }

  const clock = el.querySelector<HTMLElement>('.cm-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

const commerceMode: Mode = {
  meta: {
    id: 'commerce',
    name: '쇼핑몰 운영 모드',
    icon: '🛒',
    description: '주문이 실시간으로 쏟아지는 관리자 화면. 매출액이 오르는 동안 누구도 당신을 방해하지 않습니다.',
    hint: 'ESC: 복귀 · 주문은 저절로 들어옵니다',
  },
  mount(ctx) {
    const el = build(ctx);
    const tbody = el.querySelector('tbody')!;
    const badge = el.querySelector<HTMLElement>('.cm-badge')!;
    const card = {
      sales: el.querySelector<HTMLElement>('i[data-c="sales"]')!,
      orders: el.querySelector<HTMLElement>('i[data-c="orders"]')!,
      visitors: el.querySelector<HTMLElement>('i[data-c="visitors"]')!,
      live: el.querySelector<HTMLElement>('i[data-c="live"]')!,
    };

    let sales = ri(1800, 4200) * 1000;
    let orderCount = ri(38, 90);
    let visitors = ri(900, 2400);
    let live = ri(40, 90);
    let inquiries = ri(2, 6);
    let seq = ri(120, 400);
    const orders: Order[] = [];
    const stamp = todayStamp();

    const chipEls = new Map(
      CHIP_KEYS.map((k) => [k, el.querySelector<HTMLElement>(`i[data-chip="${k}"]`)!]),
    );
    const chipBase: Record<string, number> = { 취소: ri(1, 4), 반품: ri(0, 2), 배송완료: ri(20, 60) };

    const refreshChips = () => {
      for (const k of CHIP_KEYS) {
        const inTable = orders.filter((o) => o.status === k).length;
        chipEls.get(k)!.textContent = comma((chipBase[k] ?? 0) + inTable);
      }
    };
    const refreshCards = () => {
      card.sales.textContent = comma(sales) + '원';
      card.orders.textContent = comma(orderCount);
      card.visitors.textContent = comma(visitors);
      card.live.textContent = comma(live);
    };

    const paintStatus = (o: Order) => {
      const pill = o.tr.querySelector<HTMLElement>('.cm-pill')!;
      pill.textContent = o.status;
      pill.className = `cm-pill cm-s${ORDER_FLOW.indexOf(o.status)}`;
    };

    const addOrder = (flash: boolean, status?: OrderStatus) => {
      const p = pick(PRODUCTS);
      const qty = Math.random() < 0.2 ? ri(2, 3) : 1;
      const amount = p.price * qty;
      const pay = pick(PAY_METHODS);
      const o: Order = {
        status: status ?? (pay === '무통장입금' ? '입금전' : '배송준비중'),
        tr: document.createElement('tr'),
      };
      o.tr.innerHTML = `
        <td class="cm-no">${stamp}-${String(seq++).padStart(7, '0')}</td>
        <td class="cm-prod"></td>
        <td></td><td></td>
        <td class="cm-amt">${comma(amount)}원</td>
        <td><span class="cm-pill"></span></td>
      `;
      o.tr.children[1].textContent = p.name + (qty > 1 ? ` 외 (${qty}개)` : '');
      o.tr.children[2].textContent = pick(BUYERS);
      o.tr.children[3].textContent = pay;
      paintStatus(o);
      if (flash) {
        o.tr.classList.add('cm-new');
        ctx.later(() => o.tr.classList.remove('cm-new'), 900);
        sales += amount;
        orderCount++;
      }
      tbody.prepend(o.tr);
      orders.unshift(o);
      if (orders.length > ROW_CAP) {
        orders.pop()!.tr.remove();
      }
      refreshChips();
      refreshCards();
    };

    // 초기 주문 목록
    for (let i = 0; i < 4; i++) addOrder(false, '배송중');
    for (let i = 0; i < 4; i++) addOrder(false, '배송준비중');
    for (let i = 0; i < 3; i++) addOrder(false, '입금전');

    // 신규 주문 (2.5~5초)
    const arrive = () => {
      addOrder(true);
      ctx.later(arrive, ri(2500, 5000));
    };
    ctx.later(arrive, ri(2500, 5000));

    // 상태 전이 (2초): 최종 단계 전 주문 하나를 다음 단계로
    ctx.later(() => {
      const movable = orders.filter((o) => o.status !== '배송완료');
      if (!movable.length) return;
      const o = pick(movable);
      o.status = ORDER_FLOW[ORDER_FLOW.indexOf(o.status) + 1];
      if (o.status === '배송완료') chipBase['배송완료']++;
      paintStatus(o);
      refreshChips();
    }, 2000, true);

    // 실시간 접속자 지터 (1.5초) + 방문자 완만 증가
    ctx.later(() => {
      live = Math.max(8, live + ri(-6, 7));
      if (Math.random() < 0.6) visitors += ri(1, 5);
      refreshCards();
    }, 1500, true);

    // 미답변 문의 증감 (7초) — 벨 배지
    badge.textContent = String(inquiries);
    ctx.later(() => {
      inquiries = Math.max(0, inquiries + (Math.random() < 0.6 ? 1 : -1));
      badge.textContent = String(inquiries);
      badge.classList.toggle('cm-badge-hot', inquiries >= 5);
    }, 7000, true);

    // 아주 가끔 취소가 나야 리얼하다 (18초)
    ctx.later(() => {
      if (Math.random() < 0.5) {
        chipBase['취소']++;
        sales = Math.max(0, sales - pick(PRODUCTS).price);
        refreshChips();
        refreshCards();
      }
    }, 18000, true);
  },
};

register(commerceMode);
