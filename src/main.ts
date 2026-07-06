import './styles/tokens.css';
import './styles/base.css';
import type { Mode, ModeContext } from './core/mode';
import { get, register } from './core/registry';
import { createScheduler } from './core/scheduler';
import { renderLauncher } from './launcher/launcher';

// ── 모드 등록 (side-effect import) ──────────────────────────
// Step 3+에서 실제 모드로 대체된다.
const dummyMode: Mode = {
  meta: {
    id: 'dummy',
    name: '허공 응시 모드',
    icon: '🫥',
    description: '아무것도 하지 않지만 무언가 처리 중인 것처럼 보입니다. 코어 검증용 임시 모드.',
    hint: 'ESC: 업무포털 복귀',
  },
  mount(ctx: ModeContext) {
    ctx.root.style.cssText =
      'height:100%;display:grid;place-items:center;background:var(--term-bg);color:var(--term-dim);font-family:var(--font-mono)';
    const p = document.createElement('p');
    ctx.root.appendChild(p);
    let n = 0;
    ctx.later(() => {
      n++;
      p.textContent = `processing${'.'.repeat(n % 4)} (${n})`;
    }, 500, true);
  },
};
register(dummyMode);

// ── 부트스트랩: 해시 라우팅 + 모드 수명주기 ──────────────────
const app = document.querySelector<HTMLDivElement>('#app')!;

let cleanup: (() => void) | null = null;
let toast: HTMLElement | null = null;

function showHint(text: string, later: ModeContext['later']): void {
  toast?.remove();
  const el = document.createElement('div');
  el.className = 'hint-toast';
  el.textContent = text;
  document.body.appendChild(el);
  toast = el;
  later(() => el.remove(), 4300);
}

function route(): void {
  cleanup?.();
  cleanup = null;
  toast?.remove();
  app.innerHTML = '';

  const id = location.hash.replace(/^#\/?/, '');
  const mode = id ? get(id) : undefined;
  const sched = createScheduler();

  if (!mode) {
    if (id) history.replaceState(null, '', location.pathname); // 잘못된 해시 정리
    document.title = '(주)열일 통합업무포털';
    renderLauncher(app, sched);
    cleanup = () => sched.clearAll();
    return;
  }

  const root = document.createElement('div');
  root.style.height = '100%';
  app.appendChild(root);

  const keyHandlers: Array<(e: KeyboardEvent) => void> = [];
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return; // ESC는 전역 리스너가 선점 — 모드에 전달하지 않는다
    if (e.metaKey || e.ctrlKey || e.altKey) return; // 브라우저 단축키 방해 금지
    for (const h of keyHandlers) h(e);
  };
  window.addEventListener('keydown', onKeydown);

  const ctx: ModeContext = {
    root,
    later: sched.later,
    onKey: (h) => keyHandlers.push(h),
  };

  cleanup = () => {
    window.removeEventListener('keydown', onKeydown);
    sched.clearAll();
    mode.unmount?.();
  };

  document.title = mode.meta.name;
  mode.mount(ctx);
  showHint(mode.meta.hint, sched.later);
}

// 긴급 탈출: ESC는 라우팅 상태와 무관하게 항상 동작한다.
// (모드 mount 이전의 hashchange 대기 틈에 눌려도 유실되지 않도록 상시 리스너로 둔다)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && location.hash) location.hash = '';
});

window.addEventListener('hashchange', route);
route();
