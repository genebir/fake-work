export const FILE_NAME = '시안_메인배너_v12_진짜최종';

/** 아트보드(720×480) 위 오브젝트. 좌표는 아트보드 기준 px. */
export interface LayerDef {
  name: string;
  icon: string;   // 레이어 패널 아이콘
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  radius?: number;
}

export const ARTBOARD = { name: '메인배너_v12', w: 720, h: 480 };

export const LAYERS: LayerDef[] = [
  { name: 'Nav/상단바', icon: '▭', x: 0, y: 0, w: 720, h: 56, color: '#111827' },
  { name: 'logo_mark', icon: '◯', x: 24, y: 16, w: 24, h: 24, color: '#f24e1e', radius: 12 },
  { name: '텍스트: 히어로 카피', icon: 'T', x: 48, y: 120, w: 300, h: 28, color: '#d1d5db', radius: 4 },
  { name: '텍스트: 서브 카피', icon: 'T', x: 48, y: 162, w: 240, h: 16, color: '#e5e7eb', radius: 4 },
  { name: 'CTA_버튼_진짜최종', icon: '▭', x: 48, y: 210, w: 160, h: 48, color: '#f24e1e', radius: 8 },
  { name: 'hero_illust_v3', icon: '▨', x: 420, y: 96, w: 252, h: 288, color: '#ffe08a', radius: 12 },
  { name: '뱃지_할인율', icon: '◯', x: 600, y: 80, w: 64, h: 64, color: '#a259ff', radius: 32 },
  { name: 'Footer/법적고지', icon: 'T', x: 48, y: 430, w: 400, h: 12, color: '#e5e7eb', radius: 3 },
];

/** 협업 커서 — Figma 특유의 "회의 중" 신호 */
export const COLLABORATORS = [
  { name: '김과장', color: '#f24e1e' },
  { name: '민지(디자인2)', color: '#a259ff' },
];

export const AVATARS = ['김', '민', '박'];

export const EXPORTING_TEXT = '에셋 내보내는 중... {n}%';
export const EXPORT_DONE_TEXT = '내보내기 완료 — PNG 24개';
