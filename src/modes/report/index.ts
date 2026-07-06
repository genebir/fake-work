import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { nowClock, ri } from '../../core/utils';
import { DOC_BLOCKS, DOC_NAME } from './data';

function buildDoc(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'doc';
  el.innerHTML = `
    <div class="doc-toolbar">
      <span class="doc-save">자동 저장 <i>●</i></span>
      <span class="doc-name"></span>
      <span class="doc-clock work-clock"></span>
    </div>
    <div class="doc-menu">
      <span>파일</span><span class="on">홈</span><span>삽입</span><span>레이아웃</span>
      <span>참조</span><span>검토</span><span>보기</span>
    </div>
    <div class="doc-canvas"><div class="doc-page"></div></div>
    <div class="doc-status">
      <span class="doc-status-left">1페이지/1페이지 · <span class="doc-words">0</span>단어 · 한국어</span>
      <span class="doc-status-right">초점 100%</span>
    </div>
  `;
  el.querySelector('.doc-name')!.textContent = DOC_NAME;

  const clock = el.querySelector<HTMLElement>('.doc-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);

  ctx.root.appendChild(el);
  return el;
}

const reportMode: Mode = {
  meta: {
    id: 'report',
    name: '보고서 모드',
    icon: '📝',
    description: '「추진 계획(안)」이 완벽한 보고서체로 자동 작성됩니다. "~하고자 함"의 힘을 믿으십시오.',
    hint: 'ESC: 복귀 · 보고서는 저절로 써집니다',
  },
  mount(ctx) {
    const el = buildDoc(ctx);
    const page = el.querySelector<HTMLElement>('.doc-page')!;
    const canvas = el.querySelector<HTMLElement>('.doc-canvas')!;
    const words = el.querySelector<HTMLElement>('.doc-words')!;
    const save = el.querySelector<HTMLElement>('.doc-save')!;

    const cursor = document.createElement('span');
    cursor.className = 'doc-cursor';
    ctx.later(() => {
      cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
    }, 530, true);

    let block = 0;
    let pos = 0;
    let typed = 0;
    let node: Text | null = null;

    const step = () => {
      if (block >= DOC_BLOCKS.length) {
        save.innerHTML = '저장됨 <i>✓</i>';
        return; // 완주 — 커서만 깜빡인다
      }
      const [cls, text] = DOC_BLOCKS[block];
      if (!node) {
        const p = document.createElement('p');
        p.className = cls;
        node = document.createTextNode('');
        p.append(node, cursor);
        page.appendChild(p);
      }
      const n = ri(1, 3);
      node.data += text.slice(pos, pos + n);
      pos += n;
      typed += n;
      words.textContent = String(Math.floor(typed / 3));
      canvas.scrollTop = canvas.scrollHeight;
      if (pos >= text.length) {
        block++;
        pos = 0;
        node = null;
      }
      ctx.later(step, 60);
    };
    ctx.later(step, 600);
  },
};

register(reportMode);
