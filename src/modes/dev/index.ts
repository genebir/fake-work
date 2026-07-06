import type { Mode } from '../../core/mode';
import { register } from '../../core/registry';
import { hackerTyper, logPusher } from '../../core/utils';
import { buildTerminal } from '../_shared/terminal';
import { DEV_LOGS, PY_SOURCE } from './data';

const devMode: Mode = {
  meta: {
    id: 'dev',
    name: '개발자 모드',
    icon: '💻',
    description: '검은 화면에 초록 글자가 흐르는 동안에는 아무도 말을 걸지 않습니다. 빌드는 원래 오래 걸립니다.',
    hint: 'ESC: 복귀 · 아무 키: 코드 타이핑',
  },
  mount(ctx) {
    const term = buildTerminal(ctx, 'giseung@prod-svc: ~/workspace/settlement-api — WSL: Ubuntu');
    logPusher(term.logEl, DEV_LOGS, 350, 1400, ctx);
    const type = hackerTyper(term.typerEl, PY_SOURCE, ctx);
    ctx.onKey((e) => {
      term.showTyper();
      type(e);
    });
  },
};

register(devMode);
