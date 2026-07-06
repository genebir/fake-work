import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { nowClock, rnd } from '../../core/utils';
import { CHART_LABEL, DASH_TITLE, KPIS } from './data';

const POINTS = 72;

function buildDash(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'mk';
  el.innerHTML = `
    <header class="mk-top">
      <h1 class="mk-title"></h1>
      <span class="mk-live">● LIVE</span>
      <span class="mk-clock work-clock"></span>
    </header>
    <div class="mk-kpis"></div>
    <section class="mk-chart-card">
      <h2 class="mk-chart-label"></h2>
      <div class="mk-chart-wrap"><canvas></canvas></div>
    </section>
  `;
  el.querySelector('.mk-title')!.textContent = DASH_TITLE;
  el.querySelector('.mk-chart-label')!.textContent = CHART_LABEL;

  const kpiWrap = el.querySelector<HTMLElement>('.mk-kpis')!;
  for (const k of KPIS) {
    const card = document.createElement('div');
    card.className = 'mk-card';
    card.innerHTML = `
      <div class="mk-card-head"><span class="mk-card-label"></span><span class="mk-card-sub"></span></div>
      <div class="mk-card-value"><b data-key="${k.key}">-</b><i class="mk-arrow"></i></div>
    `;
    card.querySelector('.mk-card-label')!.textContent = k.label;
    card.querySelector('.mk-card-sub')!.textContent = k.sub;
    kpiWrap.appendChild(card);
  }

  const clock = el.querySelector<HTMLElement>('.mk-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

let detachResize: (() => void) | null = null;

const marketingMode: Mode = {
  meta: {
    id: 'marketing',
    name: '마케터 모드',
    icon: '📈',
    description: 'ROAS가 실시간으로 꿈틀거리는 대시보드. 숫자가 움직이면 캠페인을 "모니터링 중"인 겁니다.',
    hint: 'ESC: 복귀 · 지표는 실시간으로 갱신됩니다',
  },
  mount(ctx) {
    const el = buildDash(ctx);
    const canvas = el.querySelector('canvas')!;
    const wrap = el.querySelector<HTMLElement>('.mk-chart-wrap')!;
    const g = canvas.getContext('2d')!;

    // ── KPI 미세 변동 (0.9초) ──
    const values = new Map(KPIS.map((k) => [k.key, k.base]));
    const cells = new Map(
      KPIS.map((k) => {
        const b = el.querySelector<HTMLElement>(`b[data-key="${k.key}"]`)!;
        return [k.key, { b, arrow: b.nextElementSibling as HTMLElement }];
      }),
    );
    const renderKpis = (first = false) => {
      for (const k of KPIS) {
        const prev = values.get(k.key)!;
        // 광고비 소진율은 내려가면 이상하다 — 양수 편향
        const bias = k.key === 'spend' ? 0.7 : 0;
        let next = prev + rnd(-k.jitter, k.jitter) + bias * k.jitter;
        next = Math.min(k.max, Math.max(k.min, next));
        values.set(k.key, next);
        const { b, arrow } = cells.get(k.key)!;
        b.textContent = k.fmt(next);
        if (!first) {
          const up = next >= prev;
          arrow.textContent = up ? '▲' : '▼';
          arrow.className = `mk-arrow ${up ? 'mk-up' : 'mk-down'}`;
        }
      }
    };
    renderKpis(true);
    ctx.later(() => renderKpis(), 900, true);

    // ── 라인차트: 우측으로 흐르는 시계열 ──
    const series: number[] = [];
    let level = 480;
    const pushPoint = () => {
      level = Math.min(900, Math.max(120, level + rnd(-46, 48)));
      series.push(level);
      if (series.length > POINTS) series.shift();
    };
    for (let i = 0; i < POINTS; i++) pushPoint();

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      g.clearRect(0, 0, w, h);
      const lo = 0;
      const hi = 1000;
      const x = (i: number) => (i / (POINTS - 1)) * w;
      const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;

      // 가이드라인
      g.strokeStyle = 'rgba(43, 76, 126, 0.08)';
      g.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(0, (h / 5) * i);
        g.lineTo(w, (h / 5) * i);
        g.stroke();
      }

      // 영역 + 라인
      g.beginPath();
      series.forEach((v, i) => (i ? g.lineTo(x(i), y(v)) : g.moveTo(x(i), y(v))));
      g.strokeStyle = '#1b5faa';
      g.lineWidth = 2;
      g.stroke();
      g.lineTo(w, h);
      g.lineTo(0, h);
      g.closePath();
      g.fillStyle = 'rgba(27, 95, 170, 0.12)';
      g.fill();
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

    ctx.later(() => {
      pushPoint();
      draw();
    }, 900, true);
  },
  unmount() {
    detachResize?.();
    detachResize = null;
  },
};

register(marketingMode);
