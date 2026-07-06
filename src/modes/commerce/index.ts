import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { comma, nowClock, pick, ri } from '../../core/utils';
import {
  ACTIVE_MENU,
  DASH_TABS,
  INQUIRIES,
  NOTICES,
  POPUP,
  PRODUCTS,
  SHOP_SELECT,
  SIDE_MENUS,
  TODO_ALERT,
  TODO_NORMAL,
  TOP_ADS,
  UPDATES,
} from './data';

const md = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function build(ctx: ModeContext) {
  const today = new Date();
  const el = document.createElement('div');
  el.className = 'cm';
  el.innerHTML = `
    <aside class="cm-side">
      <div class="cm-logo"><b>cafe24</b><span>«</span></div>
      <button type="button" class="cm-pro-btn">👑 카페24 PRO 신청하기</button>
      <ul class="cm-menu"></ul>
    </aside>
    <div class="cm-right">
      <header class="cm-top">
        <span class="cm-shop-select">${SHOP_SELECT} <i>▾</i></span>
        <span class="cm-top-link">🖥 📱</span>
        <span class="cm-top-link">사이트캐시 삭제</span>
        <span class="cm-search">🔍 <em>카페24 통합검색</em></span>
        <span class="cm-top-link">🄿 PRO 가이드</span>
        <span class="cm-bell">🔔<i class="cm-badge">0</i><span class="cm-noti" hidden></span></span>
        <span class="cm-clock work-clock"></span>
        <span class="cm-ai-btn">🌐 카페24 AI 어시스턴트</span>
      </header>
      <div class="cm-content">
        <main class="cm-main">
          <div class="cm-adbar"><i>AD</i><span class="cm-adbar-text"></span></div>
          <section class="cm-card cm-todo">
            <h2>오늘의 할 일 <em>${md(today)} ${WEEKDAYS[today.getDay()]}요일</em> <i class="cm-help">?</i></h2>
            <div class="cm-chips"></div>
          </section>
          <section class="cm-card cm-dash">
            <div class="cm-tabs"></div>
            <div class="cm-dash-body">
              <div class="cm-chart-area">
                <div class="cm-chart-head"><span>단위/만원</span><span class="cm-chart-asof"></span></div>
                <div class="cm-chart-wrap"><canvas></canvas></div>
              </div>
              <table class="cm-sales">
                <thead><tr><th>기간별 매출</th><th><i class="d-b">●</i> 주문</th><th><i class="d-p">●</i> 결제</th><th><i class="d-o">●</i> 환불</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
          <section class="cm-card cm-services">
            <h2>주요 부가 서비스 <a>자세히 보기</a></h2>
            <div class="cm-svc-row">
              <div class="cm-svc"><span>SMS</span><b class="cm-sms">0</b>건 <button type="button">충전</button></div>
              <div class="cm-svc"><span>전자세금계산서</span><i class="cm-help">?</i> <button type="button">신청</button></div>
            </div>
          </section>
        </main>
        <aside class="cm-aside">
          <div class="cm-banner">
            <p>재고 분석 마케팅으로<br><b>4,695만 → 3.3억</b></p>
            <span class="cm-banner-cta">무료 진단 받기</span>
            <span class="cm-banner-page">1 / 3 ›</span>
          </div>
          <div class="cm-list-card">
            <h3>공지사항 <a>더보기</a></h3>
            <ul class="cm-notice-list"></ul>
          </div>
          <div class="cm-list-card">
            <h3>업데이트 <a>더보기</a></h3>
            <ul class="cm-update-list"></ul>
          </div>
        </aside>
      </div>
    </div>
    <div class="cm-popup-overlay">
      <div class="cm-popup">
        <button type="button" class="cm-popup-x" aria-label="닫기">✕</button>
        <b class="cm-popup-logo">cafe24</b>
        <span class="cm-popup-badge">${POPUP.badge}</span>
        <h2></h2>
        <p class="cm-popup-sub">${POPUP.sub}</p>
        <pre class="cm-popup-info">${POPUP.info}</pre>
        <span class="cm-popup-free"></span>
        <label class="cm-popup-today"><input type="checkbox"> 오늘 하루 보지 않기</label>
      </div>
    </div>
  `;
  el.querySelector('.cm-popup h2')!.textContent = POPUP.title;
  (el.querySelector('.cm-popup h2') as HTMLElement).innerText = POPUP.title;
  el.querySelector('.cm-popup-free')!.textContent = POPUP.free.replace('\n', ' ');

  // 사이드 메뉴
  const menu = el.querySelector('.cm-menu')!;
  for (const m of SIDE_MENUS) {
    if (m.divider) menu.appendChild(Object.assign(document.createElement('li'), { className: 'cm-div' }));
    const li = document.createElement('li');
    li.innerHTML = `<i class="cm-mi"></i><span class="cm-mname"></span>${m.badge ? '<em class="cm-new">NEW</em>' : ''}<i class="cm-chev">›</i>`;
    li.querySelector('.cm-mi')!.textContent = m.icon;
    li.querySelector('.cm-mname')!.textContent = m.name;
    if (m.name === ACTIVE_MENU) li.classList.add('on');
    menu.appendChild(li);
  }

  // 오늘의 할 일 칩
  const chips = el.querySelector<HTMLElement>('.cm-chips')!;
  for (const k of [...TODO_NORMAL, ...TODO_ALERT]) {
    const alert = (TODO_ALERT as readonly string[]).includes(k);
    const chip = document.createElement('div');
    chip.className = `cm-chip${alert ? ' cm-chip-alert' : ''}`;
    chip.innerHTML = `<span></span><b data-chip="${k}">0</b>`;
    chip.querySelector('span')!.textContent = k;
    chips.appendChild(chip);
  }

  // 탭
  const tabs = el.querySelector<HTMLElement>('.cm-tabs')!;
  DASH_TABS.forEach((t, i) => {
    const s = document.createElement('span');
    s.textContent = t;
    if (i === 0) s.className = 'on';
    tabs.appendChild(s);
  });

  // 공지/업데이트
  el.querySelector('.cm-notice-list')!.innerHTML = NOTICES.map(
    (n) => `<li>${n.pin ? '<i class="cm-pin">📌</i>' : '<i class="cm-dot">·</i>'}<span>${n.text}</span><em>${n.date}</em></li>`,
  ).join('');
  el.querySelector('.cm-update-list')!.innerHTML = UPDATES.map(
    (n) => `<li><i class="cm-dot">·</i><span>${n.text}</span><em>${n.date}</em></li>`,
  ).join('');

  const clock = el.querySelector<HTMLElement>('.cm-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

let detachResize: (() => void) | null = null;

const commerceMode: Mode = {
  meta: {
    id: 'commerce',
    name: '쇼핑몰 운영 모드',
    icon: '🛒',
    description: '카페24 관리자 대시보드가 실시간으로 움직입니다. 팝업 광고까지 완벽 재현 — 그게 진짜니까요.',
    hint: 'ESC: 복귀 · 주문은 저절로 들어옵니다',
  },
  mount(ctx) {
    const el = build(ctx);
    const badge = el.querySelector<HTMLElement>('.cm-badge')!;
    const noti = el.querySelector<HTMLElement>('.cm-noti')!;
    const smsEl = el.querySelector<HTMLElement>('.cm-sms')!;
    const adText = el.querySelector<HTMLElement>('.cm-adbar-text')!;
    const asof = el.querySelector<HTMLElement>('.cm-chart-asof')!;

    // ── 팝업: X 또는 체크박스로 닫기 ──
    const overlay = el.querySelector<HTMLElement>('.cm-popup-overlay')!;
    overlay.querySelector('.cm-popup-x')!.addEventListener('click', () => (overlay.style.display = 'none'));
    overlay.querySelector('input')!.addEventListener('change', () => (overlay.style.display = 'none'));

    // ── 상태 ──
    const chip = (k: string) => el.querySelector<HTMLElement>(`b[data-chip="${k}"]`)!;
    const counts: Record<string, number> = {
      입금전: ri(1, 4), 배송준비중: ri(2, 7), 배송보류중: 0, 배송대기: ri(0, 3), 배송중: ri(3, 10),
      취소신청: ri(0, 1), 교환신청: 0, 반품신청: ri(0, 1), 환불전: 0, 게시물관리: ri(1, 5),
    };
    const paintChips = () => {
      for (const k of Object.keys(counts)) chip(k).textContent = String(counts[k]);
    };
    paintChips();

    let sms = ri(8, 40);
    smsEl.textContent = String(sms);
    let inquiries = ri(2, 6);
    badge.textContent = String(inquiries);

    // ── 기간별 매출 표 (그저께/어제/오늘) ──
    const today = new Date();
    const days = [2, 1, 0].map((off) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - off));
    const payBase = [ri(18, 90) * 10000, ri(18, 90) * 10000, 0];
    const cntBase = [ri(3, 14), ri(3, 14), 0];
    let todaySales = ri(4, 30) * 10000;
    let todayCnt = ri(1, 6);
    const tbody = el.querySelector('.cm-sales tbody')!;
    const paintSales = () => {
      tbody.innerHTML = days
        .map((d, i) => {
          const isToday = i === 2;
          const pay = isToday ? todaySales : payBase[i];
          const cnt = isToday ? todayCnt : cntBase[i];
          return `<tr class="${isToday ? 'cm-today' : ''}">
            <th>${md(d)}${isToday ? ' <em>오늘</em>' : ''}</th>
            <td>${comma(pay)} 원<i>${cnt}건</i></td>
            <td>${comma(pay)} 원<i>${cnt}건</i></td>
            <td>0 원<i>0건</i></td>
          </tr>`;
        })
        .join('');
    };
    paintSales();

    // ── 차트: 최근 7일 막대 (오늘 막대가 자란다) ──
    const canvas = el.querySelector('canvas')!;
    const wrap = el.querySelector<HTMLElement>('.cm-chart-wrap')!;
    const g = canvas.getContext('2d')!;
    const week = [6, 5, 4, 3, 2, 1, 0].map((off) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - off));
    const bars = week.map((_, i) => (i < 6 ? ri(20, 260) : 0)); // 만원 단위
    const draw = () => {
      bars[6] = Math.round(todaySales / 10000);
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      g.clearRect(0, 0, w, h);
      const max = Math.max(...bars, 100) * 1.2;
      const pad = h * 0.14;
      const bw = w / 7;
      g.font = `${Math.round(h * 0.07)}px sans-serif`;
      g.textAlign = 'center';
      bars.forEach((v, i) => {
        const bh = (v / max) * (h - pad * 2);
        const x = bw * i + bw * 0.3;
        g.fillStyle = i === 6 ? '#2f54eb' : '#c4cff5';
        g.fillRect(x, h - pad - bh, bw * 0.4, bh);
        g.fillStyle = '#8a93a5';
        const d = week[i];
        g.fillText(`${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`, bw * i + bw / 2, h - pad * 0.25);
      });
    };
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(wrap.clientWidth * dpr);
      canvas.height = Math.floor(wrap.clientHeight * dpr);
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    detachResize = () => ro.disconnect();
    resize();

    const stampAsof = () => {
      const d = new Date();
      asof.textContent = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${nowClock().slice(0, 5)} 기준`;
    };
    stampAsof();
    ctx.later(stampAsof, 30000, true);

    const showNoti = (text: string) => {
      noti.textContent = text;
      noti.hidden = false;
      ctx.later(() => (noti.hidden = true), 3500);
    };

    // ── 신규 주문 (2.5~5초): 매출/칩/차트/SMS 연동 ──
    const arrive = () => {
      const p = pick(PRODUCTS);
      const qty = Math.random() < 0.4 ? ri(2, 5) : 1;
      const amount = p.price * qty;
      const bank = Math.random() < 0.4; // 무통장 비중 (B2B)
      counts[bank ? '입금전' : '배송준비중']++;
      todaySales += amount;
      todayCnt++;
      if (sms > 0) smsEl.textContent = String(--sms); // 주문 알림톡 발송
      smsEl.parentElement!.classList.toggle('cm-svc-empty', sms === 0);
      paintChips();
      paintSales();
      draw();
      if (Math.random() < 0.4) showNoti(`신규 주문: ${p.name}${qty > 1 ? ` × ${qty}` : ''} (${comma(amount)}원)`);
      ctx.later(arrive, ri(2500, 5000));
    };
    ctx.later(arrive, ri(2500, 5000));

    // ── 배송 흐름 (3초): 입금전→배송준비중→배송중→(출고 완료로 소멸) ──
    ctx.later(() => {
      const flow: Array<[string, string | null]> = [['입금전', '배송준비중'], ['배송준비중', '배송중'], ['배송중', null]];
      const movable = flow.filter(([from]) => counts[from] > 0);
      if (!movable.length) return;
      const [from, to] = pick(movable);
      counts[from]--;
      if (to) counts[to]++;
      paintChips();
    }, 3000, true);

    // ── 문의/게시물/클레임 (7초) ──
    ctx.later(() => {
      const roll = Math.random();
      if (roll < 0.45) {
        inquiries++;
        counts['게시물관리']++;
        showNoti(`새 문의: ${pick(INQUIRIES)}`);
      } else if (roll < 0.6 && inquiries > 0) {
        inquiries--;
        counts['게시물관리'] = Math.max(0, counts['게시물관리'] - 1);
      } else if (roll < 0.68) {
        counts[pick([...TODO_ALERT.slice(0, 4)])]++; // 가끔 클레임이 있어야 리얼하다
      }
      badge.textContent = String(inquiries);
      badge.classList.toggle('cm-badge-hot', inquiries >= 5);
      paintChips();
    }, 7000, true);

    // ── 상단 광고 롤링 (8초) ──
    let ad = 0;
    adText.textContent = TOP_ADS[0];
    ctx.later(() => {
      ad = (ad + 1) % TOP_ADS.length;
      adText.textContent = TOP_ADS[ad];
    }, 8000, true);

  },
  unmount() {
    detachResize?.();
    detachResize = null;
  },
};

register(commerceMode);
