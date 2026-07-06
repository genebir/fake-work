import './launcher.css';
import { all } from '../core/registry';
import { pick } from '../core/utils';
import type { Scheduler } from '../core/scheduler';

const NOTICES = [
  '모니터를 응시하는 표정 관리는 본 시스템이 지원하지 않습니다. 미간을 살짝 찌푸려 주세요.',
  '[필독] 주간보고 양식이 v11로 변경되었습니다. v10과의 차이점은 없습니다.',
  '4층 탕비실 커피머신 수리 완료. 단, 얼음은 여전히 셀프입니다.',
  '보안 안내: 뒤에서 인기척이 느껴지면 ESC 키가 Alt+Tab보다 0.3초 빠릅니다.',
  '전사 문화 캠페인 "회의는 짧게" 3주차 — 관련 설명회가 2시간 진행될 예정입니다.',
];

const DENY_MESSAGES = [
  '권한이 없습니다. (결재선: 본인 → 팀장 → 본부장 → 반려)',
  '세션이 만료되지 않았습니다. 계속 근무하세요.',
  '해당 기능은 2019년 차세대 프로젝트에서 개편 예정입니다.',
];

/** 그룹웨어 위장 런처. 반환값 없음 — 정리는 호출측 scheduler.clearAll()로 충분. */
export function renderLauncher(container: HTMLElement, sched: Scheduler): void {
  const el = document.createElement('div');
  el.className = 'gw';
  el.innerHTML = `
    <header class="gw-topbar">
      <div class="gw-brand">
        <span class="gw-logo">▣</span>
        <b>(주)열일 통합업무포털</b>
        <span class="gw-ver">Work Simulation System v2.4.1</span>
      </div>
      <div class="gw-user">
        김대리 님 <span class="gw-sep">|</span> 근태: <b class="gw-ontime">정상출근 09:00</b>
        <span class="gw-sep">|</span> <button type="button" class="gw-logout">로그아웃</button>
      </div>
    </header>
    <div class="gw-notice">
      <span class="gw-notice-badge">공지</span>
      <span class="gw-notice-text" aria-live="polite"></span>
    </div>
    <main class="gw-main">
      <h1 class="gw-title">업무 시뮬레이션 선택</h1>
      <p class="gw-desc">수행할 업무 유형을 선택하십시오. 선택 즉시 해당 업무가 자동으로 진행됩니다.</p>
      <div class="gw-grid" role="list"></div>
    </main>
    <footer class="gw-footer">
      <p>본 시스템은 실제 업무 성과를 생성하지 않습니다. 성과에 대한 책임은 전적으로 사용자에게 있습니다.</p>
      <p>단축키: <kbd>Tab</kbd> 이동 · <kbd>Enter</kbd> 실행 · 업무 화면에서 <kbd>ESC</kbd> 즉시 복귀</p>
      <p class="gw-copy">ⓒ (주)열일 정보전략팀 · 문의: 내선 4번 (부재중)</p>
    </footer>
  `;

  // 모드 카드 그리드
  const grid = el.querySelector<HTMLElement>('.gw-grid')!;
  for (const mode of all()) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'gw-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <span class="gw-card-icon" aria-hidden="true"></span>
      <span class="gw-card-body">
        <span class="gw-card-name"></span>
        <span class="gw-card-desc"></span>
      </span>
      <span class="gw-card-go">실행 ▸</span>
    `;
    card.querySelector('.gw-card-icon')!.textContent = mode.meta.icon;
    card.querySelector('.gw-card-name')!.textContent = mode.meta.name;
    card.querySelector('.gw-card-desc')!.textContent = mode.meta.description;
    card.addEventListener('click', () => {
      location.hash = `#/${mode.meta.id}`;
    });
    grid.appendChild(card);
  }
  if (all().length === 0) {
    grid.innerHTML = '<p class="gw-empty">등록된 업무가 없습니다. 부럽습니다.</p>';
  }

  // 공지 롤링
  const noticeEl = el.querySelector<HTMLElement>('.gw-notice-text')!;
  let idx = 0;
  noticeEl.textContent = NOTICES[0];
  sched.later(() => {
    idx = (idx + 1) % NOTICES.length;
    noticeEl.textContent = NOTICES[idx];
  }, 6000, true);

  // 로그아웃: 당연히 안 됨
  el.querySelector('.gw-logout')!.addEventListener('click', () => {
    const toast = document.createElement('div');
    toast.className = 'hint-toast';
    toast.textContent = pick(DENY_MESSAGES);
    el.appendChild(toast);
    sched.later(() => toast.remove(), 4200);
  });

  container.appendChild(el);
}
