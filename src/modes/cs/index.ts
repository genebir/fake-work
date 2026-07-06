import './style.css';
import type { Mode, ModeContext } from '../../core/mode';
import { register } from '../../core/registry';
import { nowClock, pick, ri, rnd } from '../../core/utils';
import { AGENTS, CHANNELS, CUSTOMERS, STATUS, SUBJECTS } from './data';

type TicketStatus = keyof typeof STATUS;

interface Ticket {
  no: number;
  status: TicketStatus;
  agent: string;
  elapsed: number; // 분
  tr: HTMLTableRowElement;
}

const ROW_CAP = 28;

function build(ctx: ModeContext) {
  const el = document.createElement('div');
  el.className = 'cs';
  el.innerHTML = `
    <header class="cs-top">
      <b>열일데스크</b>
      <span class="cs-queue">상담원 4명 응대 중 · 콜백 대기 2건</span>
      <span class="cs-clock work-clock"></span>
    </header>
    <div class="cs-stats">
      <div class="cs-stat"><i data-s="waiting">0</i><span>대기</span></div>
      <div class="cs-stat"><i data-s="progress">0</i><span>처리 중</span></div>
      <div class="cs-stat"><i data-s="done">0</i><span>오늘 완료</span></div>
      <div class="cs-stat"><i data-s="csat">94.2%</i><span>만족도(7일)</span></div>
    </div>
    <div class="cs-table-wrap">
      <table class="cs-table">
        <thead><tr><th>번호</th><th>제목</th><th>고객</th><th>채널</th><th>상태</th><th>담당</th><th>경과</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  const clock = el.querySelector<HTMLElement>('.cs-clock')!;
  const tick = () => (clock.textContent = nowClock());
  tick();
  ctx.later(tick, 1000, true);
  ctx.root.appendChild(el);
  return el;
}

const csMode: Mode = {
  meta: {
    id: 'cs',
    name: '상담원 모드',
    icon: '🎧',
    description: '티켓이 쉬지 않고 쌓이는 헬프데스크. 대기 카운트가 줄지 않는 한 자리를 뜰 수 없어 보입니다.',
    hint: 'ESC: 복귀 · 티켓은 저절로 처리됩니다',
  },
  mount(ctx) {
    const el = build(ctx);
    const tbody = el.querySelector('tbody')!;
    const stat = {
      waiting: el.querySelector<HTMLElement>('i[data-s="waiting"]')!,
      progress: el.querySelector<HTMLElement>('i[data-s="progress"]')!,
      done: el.querySelector<HTMLElement>('i[data-s="done"]')!,
      csat: el.querySelector<HTMLElement>('i[data-s="csat"]')!,
    };

    let ticketNo = ri(48210, 48400);
    let doneToday = ri(37, 120);
    let csat = 94.2;
    const tickets: Ticket[] = [];

    const paintStatus = (t: Ticket) => {
      const pill = t.tr.querySelector<HTMLElement>('.cs-pill')!;
      pill.textContent = STATUS[t.status];
      pill.className = `cs-pill cs-${t.status}`;
      t.tr.querySelector<HTMLElement>('.cs-agent')!.textContent = t.agent || '-';
      t.tr.querySelector<HTMLElement>('.cs-elapsed')!.textContent = `${t.elapsed}분`;
    };

    const refreshStats = () => {
      stat.waiting.textContent = String(tickets.filter((t) => t.status === 'waiting').length);
      stat.progress.textContent = String(tickets.filter((t) => t.status === 'progress').length);
      stat.done.textContent = String(doneToday);
    };

    const addTicket = (flash: boolean, status: TicketStatus = 'waiting') => {
      const t: Ticket = {
        no: ticketNo++,
        status,
        agent: status === 'waiting' ? '' : pick(AGENTS),
        elapsed: status === 'waiting' ? ri(0, 4) : ri(3, 40),
        tr: document.createElement('tr'),
      };
      t.tr.innerHTML = `
        <td class="cs-no">#${t.no}</td>
        <td class="cs-subject"></td>
        <td></td><td></td>
        <td><span class="cs-pill"></span></td>
        <td class="cs-agent"></td>
        <td class="cs-elapsed"></td>
      `;
      t.tr.children[1].textContent = pick(SUBJECTS);
      t.tr.children[2].textContent = pick(CUSTOMERS);
      t.tr.children[3].textContent = pick(CHANNELS);
      paintStatus(t);
      if (flash) {
        t.tr.classList.add('cs-new');
        ctx.later(() => t.tr.classList.remove('cs-new'), 900);
      }
      tbody.prepend(t.tr);
      tickets.unshift(t);
      // 캡: 오래된 완료부터, 없으면 그냥 마지막 행 제거
      if (tickets.length > ROW_CAP) {
        const idx = tickets.map((x) => x.status).lastIndexOf('done');
        const victim = idx >= 0 ? idx : tickets.length - 1;
        tickets[victim].tr.remove();
        tickets.splice(victim, 1);
      }
      refreshStats();
    };

    // 초기 큐: 완료 몇 건 + 처리 중 + 대기
    for (let i = 0; i < 5; i++) addTicket(false, 'done');
    for (let i = 0; i < 3; i++) addTicket(false, 'progress');
    for (let i = 0; i < 4; i++) addTicket(false, 'waiting');

    // 새 티켓 도착 (2.2~4초)
    const arrive = () => {
      addTicket(true);
      ctx.later(arrive, ri(2200, 4000));
    };
    ctx.later(arrive, ri(2200, 4000));

    // 상태 전이 (1.6초)
    ctx.later(() => {
      const waiting = tickets.filter((t) => t.status === 'waiting');
      const progress = tickets.filter((t) => t.status === 'progress');
      // 대기가 밀리면 우선 배정 — 그래도 새 티켓이 더 빨리 쌓이는 게 현실이다
      if (waiting.length && (progress.length < 3 || Math.random() < 0.55)) {
        const t = waiting[waiting.length - 1]; // 오래된 것부터
        t.status = 'progress';
        t.agent = pick(AGENTS);
        paintStatus(t);
      } else if (progress.length) {
        const t = pick(progress);
        t.status = 'done';
        doneToday++;
        paintStatus(t);
      }
      refreshStats();
    }, 1600, true);

    // 경과 시간 + 만족도
    ctx.later(() => {
      for (const t of tickets) {
        if (t.status !== 'done' && Math.random() < 0.5) {
          t.elapsed++;
          t.tr.querySelector<HTMLElement>('.cs-elapsed')!.textContent = `${t.elapsed}분`;
        }
      }
      csat = Math.min(99.9, Math.max(88, csat + rnd(-0.15, 0.15)));
      stat.csat.textContent = `${csat.toFixed(1)}%`;
    }, 5000, true);
  },
};

register(csMode);
