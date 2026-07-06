import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { nowClock, ri, rnd } from '../../core/utils';
import {
  ARTBOARD,
  AVATARS,
  COLLABORATORS,
  EXPORTING_TEXT,
  EXPORT_DONE_TEXT,
  FILE_NAME,
  LAYERS,
} from './data';

function build(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'fg';
  el.innerHTML = `
    <div class="fg-top">
      <span class="fg-tools" aria-hidden="true"><i>⬚</i><i class="on">⌖</i><i>▭</i><i>✎</i><i>T</i></span>
      <span class="fg-file"></span>
      <span class="fg-avatars" aria-hidden="true"></span>
      <button type="button" class="fg-share">공유</button>
      <span class="fg-zoom">64%</span>
      <span class="fg-clock work-clock"></span>
    </div>
    <div class="fg-main">
      <aside class="fg-layers">
        <h3>레이어</h3>
        <div class="fg-page">페이지 1</div>
        <ul></ul>
      </aside>
      <div class="fg-canvas">
        <div class="fg-stage">
          <div class="fg-artboard-label"></div>
          <div class="fg-artboard"></div>
        </div>
        <div class="fg-select" hidden>
          <i class="fg-h fg-h1"></i><i class="fg-h fg-h2"></i><i class="fg-h fg-h3"></i><i class="fg-h fg-h4"></i>
          <span class="fg-size"></span>
        </div>
        <div class="fg-export" hidden>
          <span class="fg-export-text"></span>
          <div class="fg-export-bar"><i></i></div>
        </div>
      </div>
      <aside class="fg-props">
        <div class="fg-tabs"><span class="on">디자인</span><span>프로토타입</span><span>검사</span></div>
        <dl>
          <div><dt>X</dt><dd data-p="x">-</dd></div>
          <div><dt>Y</dt><dd data-p="y">-</dd></div>
          <div><dt>W</dt><dd data-p="w">-</dd></div>
          <div><dt>H</dt><dd data-p="h">-</dd></div>
          <div><dt>불투명도</dt><dd>100%</dd></div>
          <div><dt>모서리</dt><dd data-p="r">-</dd></div>
        </dl>
      </aside>
    </div>
  `;
  el.querySelector('.fg-file')!.textContent = `${FILE_NAME} ✓`;
  el.querySelector('.fg-artboard-label')!.textContent = ARTBOARD.name;
  el.querySelector('.fg-avatars')!.innerHTML = AVATARS.map((a) => `<i>${a}</i>`).join('');

  const clock = el.querySelector<HTMLElement>('.fg-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

const designerMode: Mode = {
  meta: {
    id: 'designer',
    name: '디자이너 모드',
    icon: '🎨',
    description: '시안 v12가 캔버스 위에서 미세하게 다듬어집니다. 팀원 커서가 돌아다니는 동안은 리뷰 회의 중입니다.',
    hint: 'ESC: 복귀 · 시안은 알아서 다듬어집니다',
  },
  mount(ctx) {
    const el = build(ctx);
    const artboard = el.querySelector<HTMLElement>('.fg-artboard')!;
    const canvas = el.querySelector<HTMLElement>('.fg-canvas')!;
    const layerList = el.querySelector<HTMLElement>('.fg-layers ul')!;
    const selectRing = el.querySelector<HTMLElement>('.fg-select')!;
    const sizeLabel = el.querySelector<HTMLElement>('.fg-size')!;
    const zoomEl = el.querySelector<HTMLElement>('.fg-zoom')!;

    // 오브젝트 + 레이어 리스트 렌더 (레이어 패널은 위쪽 레이어가 먼저)
    const geo = LAYERS.map((l) => ({ ...l }));
    const objs = geo.map((l) => {
      const d = document.createElement('div');
      d.className = 'fg-obj';
      d.style.cssText = `left:${l.x}px;top:${l.y}px;width:${l.w}px;height:${l.h}px;background:${l.color};border-radius:${l.radius ?? 0}px`;
      artboard.appendChild(d);
      return d;
    });
    const items = [...geo].reverse().map((l) => {
      const li = document.createElement('li');
      li.innerHTML = `<i></i><span></span>`;
      li.querySelector('i')!.textContent = l.icon;
      li.querySelector('span')!.textContent = l.name;
      layerList.appendChild(li);
      return li;
    });

    // ── 자동 레이어 선택 + 미세 조정 (1.8초) ──
    let selected = -1;
    const props = {
      x: el.querySelector<HTMLElement>('dd[data-p="x"]')!,
      y: el.querySelector<HTMLElement>('dd[data-p="y"]')!,
      w: el.querySelector<HTMLElement>('dd[data-p="w"]')!,
      h: el.querySelector<HTMLElement>('dd[data-p="h"]')!,
      r: el.querySelector<HTMLElement>('dd[data-p="r"]')!,
    };
    const placeRing = () => {
      if (selected < 0) return;
      const o = objs[selected].getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      selectRing.style.cssText = `left:${o.left - c.left}px;top:${o.top - c.top}px;width:${o.width}px;height:${o.height}px`;
      selectRing.hidden = false;
      sizeLabel.textContent = `${geo[selected].w} × ${geo[selected].h}`;
    };
    const select = (i: number) => {
      selected = i;
      items.forEach((li, k) => li.classList.toggle('on', k === items.length - 1 - i));
      const l = geo[i];
      props.x.textContent = String(l.x);
      props.y.textContent = String(l.y);
      props.w.textContent = String(l.w);
      props.h.textContent = String(l.h);
      props.r.textContent = String(l.radius ?? 0);
      placeRing();
    };
    select(ri(0, geo.length - 1));
    ctx.later(() => {
      const i = ri(0, geo.length - 1);
      // 20%: 선택한 요소를 1~3px "다듬기"
      if (Math.random() < 0.2) {
        const l = geo[i];
        l.x += ri(-3, 3);
        l.y += ri(-2, 2);
        objs[i].style.left = `${l.x}px`;
        objs[i].style.top = `${l.y}px`;
      }
      select(i);
      if (Math.random() < 0.15) zoomEl.textContent = `${ri(48, 110)}%`;
    }, 1800, true);

    // ── 협업 커서 ──
    const cursors = COLLABORATORS.map((c) => {
      const d = document.createElement('div');
      d.className = 'fg-cursor';
      d.innerHTML = `<svg width="14" height="16" viewBox="0 0 14 16"><path d="M1 1 L13 8 L7 9 L5 15 Z" fill="${c.color}"/></svg><span></span>`;
      d.querySelector('span')!.textContent = c.name;
      (d.querySelector('span') as HTMLElement).style.background = c.color;
      canvas.appendChild(d);
      return { el: d, x: rnd(80, 500), y: rnd(80, 400), tx: rnd(80, 500), ty: rnd(80, 400) };
    });
    ctx.later(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      for (const cur of cursors) {
        const dx = cur.tx - cur.x;
        const dy = cur.ty - cur.y;
        if (Math.abs(dx) + Math.abs(dy) < 8) {
          cur.tx = rnd(40, Math.max(120, w - 60));
          cur.ty = rnd(50, Math.max(120, h - 40));
          continue;
        }
        cur.x += dx * 0.055 + rnd(-1.2, 1.2);
        cur.y += dy * 0.055 + rnd(-1.2, 1.2);
        cur.el.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
      }
    }, 90, true);

    // ── 에셋 내보내기 진행바 (10~16초 주기) ──
    const exportBox = el.querySelector<HTMLElement>('.fg-export')!;
    const exportText = el.querySelector<HTMLElement>('.fg-export-text')!;
    const exportFill = exportBox.querySelector<HTMLElement>('.fg-export-bar i')!;
    let phase: 'idle' | 'run' | 'done' = 'idle';
    let wait = ri(40, 90); // ×100ms
    let progress = 0;
    ctx.later(() => {
      if (phase === 'idle') {
        if (--wait > 0) return;
        phase = 'run';
        progress = 0;
        exportBox.hidden = false;
      } else if (phase === 'run') {
        progress = Math.min(100, progress + rnd(1.5, 4.5));
        exportFill.style.width = `${progress}%`;
        exportText.textContent = EXPORTING_TEXT.replace('{n}', String(Math.floor(progress)));
        if (progress >= 100) {
          phase = 'done';
          wait = 18;
          exportText.textContent = EXPORT_DONE_TEXT;
        }
      } else {
        if (--wait > 0) return;
        phase = 'idle';
        wait = ri(100, 160);
        exportBox.hidden = true;
      }
    }, 100, true);
  },
};

register(designerMode);
