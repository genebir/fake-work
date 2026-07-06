/**
 * 모드 수명주기에 묶인 타이머 관리자.
 * 모드 진입 시 하나 생성하고, 이탈 시 clearAll()로 전부 해제한다.
 * 모드 코드는 setInterval/setTimeout을 직접 쓰지 않고 반드시 later()만 쓴다.
 */
export interface Scheduler {
  later: (fn: () => void, ms: number, repeat?: boolean) => number;
  clearAll: () => void;
}

export function createScheduler(): Scheduler {
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  const intervals = new Set<ReturnType<typeof setInterval>>();

  const later = (fn: () => void, ms: number, repeat = false): number => {
    if (repeat) {
      const id = setInterval(fn, ms);
      intervals.add(id);
      return id as unknown as number;
    }
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, ms);
    timeouts.add(id);
    return id as unknown as number;
  };

  const clearAll = () => {
    timeouts.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    timeouts.clear();
    intervals.clear();
  };

  return { later, clearAll };
}
