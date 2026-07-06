import type { Mode } from '../../core/mode';
import { register } from '../../core/registry';
import { hackerTyper, logPusher } from '../../core/utils';
import { buildTerminal } from '../_shared/terminal';
import { DE_LOGS, SPARK_SOURCE } from './data';

const dataEngineerMode: Mode = {
  meta: {
    id: 'data-engineer',
    name: '데이터 엔지니어 모드',
    icon: '🛢️',
    description: '파이프라인은 어젯밤에도 돌았고 지금도 돌고 있습니다. lag이 0이 되기 전까지는 자리를 지켜야 합니다.',
    hint: 'ESC: 복귀 · 아무 키: 코드 타이핑',
  },
  mount(ctx) {
    const term = buildTerminal(ctx, 'airflow-worker-3 | dag: dw_daily_batch');
    logPusher(term.logEl, DE_LOGS, 350, 1400, ctx);
    const type = hackerTyper(term.typerEl, SPARK_SOURCE, ctx);
    ctx.onKey((e) => {
      term.showTyper();
      type(e);
    });
  },
};

register(dataEngineerMode);
