import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { comma, nowClock, pick, ri, rnd } from '../src/core/utils';
import { createScheduler } from '../src/core/scheduler';

describe('rnd', () => {
  it('[a, b) 범위의 실수를 반환한다', () => {
    for (let i = 0; i < 100; i++) {
      const v = rnd(1.5, 3.5);
      expect(v).toBeGreaterThanOrEqual(1.5);
      expect(v).toBeLessThan(3.5);
    }
  });
});

describe('ri', () => {
  it('[a, b] 범위의 정수를 반환한다 (inclusive)', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = ri(1, 3);
      expect(Number.isInteger(v)).toBe(true);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
});

describe('pick', () => {
  it('배열의 원소만 반환한다', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) expect(arr).toContain(pick(arr));
  });
});

describe('comma', () => {
  it('천 단위 콤마를 찍는다', () => {
    expect(comma(0)).toBe('0');
    expect(comma(1234)).toBe('1,234');
    expect(comma(98765432)).toBe('98,765,432');
    expect(comma(-1234567)).toBe('-1,234,567');
  });
});

describe('nowClock', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('HH:MM:SS 포맷, 0 패딩', () => {
    vi.setSystemTime(new Date(2026, 6, 6, 9, 5, 3));
    expect(nowClock()).toBe('09:05:03');
  });
});

describe('scheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('later()는 1회성 타이머를 실행한다', () => {
    const s = createScheduler();
    const fn = vi.fn();
    s.later(fn, 100);
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('later(repeat)는 반복 실행한다', () => {
    const s = createScheduler();
    const fn = vi.fn();
    s.later(fn, 100, true);
    vi.advanceTimersByTime(350);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('clearAll()은 모든 타이머를 해제한다 (모드 전환 시 누수 없음)', () => {
    const s = createScheduler();
    const once = vi.fn();
    const rep = vi.fn();
    const chained = vi.fn(() => s.later(chained, 50)); // logPusher처럼 스스로 재등록하는 패턴
    s.later(once, 100);
    s.later(rep, 100, true);
    s.later(chained, 50);
    vi.advanceTimersByTime(60); // chained 1회 실행 → 다음 타이머 재등록됨
    expect(chained).toHaveBeenCalledTimes(1);

    s.clearAll();
    vi.advanceTimersByTime(10000);
    expect(once).not.toHaveBeenCalled();
    expect(rep).not.toHaveBeenCalled();
    expect(chained).toHaveBeenCalledTimes(1); // 재등록분도 함께 해제
    expect(vi.getTimerCount()).toBe(0);
  });

  it('실행 완료된 1회성 타이머는 내부 목록에서 제거된다', () => {
    const s = createScheduler();
    s.later(() => {}, 10);
    vi.advanceTimersByTime(10);
    expect(vi.getTimerCount()).toBe(0);
    s.clearAll(); // 이미 끝난 타이머를 clear해도 에러 없음
  });
});
