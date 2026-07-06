export interface ModeMeta {
  id: string;           // 'dev', 'excel' ...
  name: string;         // '개발자 모드'
  icon: string;         // 이모지 1개
  description: string;  // 런처 카드에 표시할 1~2문장 (위트 필수)
  hint: string;         // 실행 직후 토스트 문구 (예: 'ESC: 복귀 · 아무 키: 코드 타이핑')
}

export interface ModeContext {
  root: HTMLElement;                       // 모드가 렌더할 컨테이너
  later: (fn: () => void, ms: number, repeat?: boolean) => number;  // 자동 해제되는 타이머
  onKey: (handler: (e: KeyboardEvent) => void) => void;            // ESC 제외 키 입력 구독
}

export interface Mode {
  meta: ModeMeta;
  mount(ctx: ModeContext): void;   // 진입: DOM 생성 + 타이머 시작
  unmount?(): void;                // 이탈: later로 만든 타이머는 자동 해제, 그 외 정리만
}
