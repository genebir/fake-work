// 레퍼런스: duarltmd.cafe24.com 관리자 대시보드 실물 (2026-07 기준 EC admin)
// 상품명/가격은 모든포장(koreanhc7) 실제 판매 품목, 주문 데이터는 전부 난수.
export const SHOP_SELECT = '(기본) 한국어 쇼핑몰';

export interface SideMenu {
  name: string;
  icon: string;
  badge?: 'NEW';
  divider?: boolean; // 이 항목 앞에 구분선
}

export const SIDE_MENUS: SideMenu[] = [
  { name: '홈', icon: '⌂' },
  { name: '주문', icon: '🛒' },
  { name: '상품', icon: '👕' },
  { name: '고객', icon: '👤' },
  { name: '메시지', icon: '💬', badge: 'NEW' },
  { name: '게시판', icon: '📄' },
  { name: '디자인 (PC/모바일)', icon: '🎨' },
  { name: '프로모션', icon: '％' },
  { name: '카페24 애널리틱스', icon: '📈', badge: 'NEW' },
  { name: '통계', icon: '📊' },
  { name: '통합엑셀', icon: '📗' },
  { name: '카페24 PRO', icon: '🏅', divider: true },
  { name: '카페24 글로벌', icon: '🌐', badge: 'NEW' },
  { name: '카페24 매일배송', icon: '🚚', divider: true },
  { name: '구글 & 유튜브', icon: 'G' },
  { name: '마켓플러스', icon: '🏪' },
  { name: '마케팅', icon: '📣' },
  { name: '드랍쉬핑', icon: '📦' },
  { name: '판매 채널', icon: '🔗' },
  { name: '앱', icon: '🧩' },
  { name: '부가서비스', icon: '➕' },
];

export const ACTIVE_MENU = '홈';

/** 오늘의 할 일 칩 — 앞 5개는 일반, 뒤 5개는 빨간 계열 */
export const TODO_NORMAL = ['입금전', '배송준비중', '배송보류중', '배송대기', '배송중'] as const;
export const TODO_ALERT = ['취소신청', '교환신청', '반품신청', '환불전', '게시물관리'] as const;

export const DASH_TABS = ['일별 매출 현황', '실시간 접속 현황', '주문처리 현황', '회원/적립금 현황', '예치금 현황', '게시물 현황'];

export const TOP_ADS = [
  '카카오·네이버 1초 가입으로, 매출까지 378% 상승!',
  '재고 분석 마케팅으로 광고 순매출 4,695만 → 3.3억',
  'SMS 지금 충전하면 보너스 10% — 충전은 언제나 옳습니다',
  '좋아요 봇한테 돈 버리셨나요? 찐 콘텐츠 매출만 100% 추적',
];

export const NOTICES = [
  { text: '[중요] 무효 발신번호 메시지 차단 안내', date: '06.25', pin: true },
  { text: '[신규 출시] 카페24 LLM Router 안내', date: '06.24', pin: true },
  { text: '[안내] 쇼핑몰 ‘개인정보 처리방침’ 개정', date: '07.06' },
  { text: '고객발행분 2026년 2분기(04월-06월) 안내', date: '07.01' },
  { text: '[공지] 카페24페이먼츠 정산자금 지급 일정', date: '07.01' },
];

export const UPDATES = [
  { text: '[판매채널] 네이버 쇼핑 DB URL 변경 안내', date: '07.06' },
  { text: '[디자인] 회원이 쿠폰을 놓치지 않도록 개선', date: '07.01' },
  { text: '[판매채널] 상품 비디오를 등록해 보세요', date: '07.01' },
  { text: '[주문] EU 통관 부가세 정책 변경 대응', date: '06.30' },
  { text: '[마켓플러스] 쿠팡 상품 등록 시 브랜드 검증', date: '06.23' },
];

export const POPUP = {
  badge: '뜨거운 호응에 힘입어 다시 열립니다!',
  title: 'K-포장 이커머스\n혁신 컨퍼런스',
  sub: '카페24가 전하는 봉투 성장 전략',
  info: '일시 | 2026.7.14(화) 13:30 - 16:30\n장소 | 여의도 FKI플라자 1F 그랜드볼룸',
  free: '참가비\n전액 무료',
};

export const PRODUCTS = [
  { name: 'opp접착봉투 5×8+4cm (1,000장)', price: 7260 },
  { name: 'opp접착봉투 8×20+4cm (1,000장)', price: 13920 },
  { name: 'opp접착봉투 13×30+4cm (200장)', price: 5570 },
  { name: 'OPP 비접착 투명 8.5×23+6.5cm (100장)', price: 8470 },
  { name: 'PE투명 지퍼백 0.05×10×15cm (100장)', price: 1950 },
  { name: 'PE투명 지퍼백 0.1×12×15cm (100장)', price: 4550 },
  { name: 'PE투명 지퍼백 0.1×25×35cm (100장)', price: 19500 },
  { name: '진공포장지 0.07×23×32cm (100장)', price: 9900 },
  { name: '진공포장지 0.07×25×35cm (100장)', price: 13860 },
  { name: '은박지퍼스탠드 10×17 (100장)', price: 11000 },
  { name: '크라프트 커피봉투 (M방) 7×22cm (100장)', price: 12000 },
  { name: '은박커피봉투 (M방/200g) 9×25 (100장)', price: 22000 },
  { name: '크라프트 지퍼스탠드 커피봉투 200g (1박스 600장)', price: 177000 },
  { name: 'HD투명 돈까스봉투 (대) 31×54cm (100장)', price: 9240 },
  { name: '무지 PP식빵봉투 16×30+5cm (200장)', price: 12000 },
  { name: '크라프트 트위스트 쇼핑백 미니 (100장)', price: 16500 },
  { name: '무지 각대봉투 중 (100장)', price: 4500 },
  { name: '크라프트 자동쇼핑백 30.5 특대 (100장)', price: 25000 },
  { name: 'HD청보라 택배봉투 30×38+4cm (100장)', price: 14180 },
  { name: 'HD다크블루 택배봉투 20×28+4cm (100장)', price: 9510 },
  { name: '증착 택배봉투 25×35cm (100장)', price: 10800 },
  { name: '부직포 복주머니 (50장)', price: 25500 },
  { name: '알루미늄 스파우트 스탠드 봉투 500g (1박스 700개)', price: 229000 },
];

export const INQUIRIES = [
  '커피봉투에 로고 인쇄 가능한가요? (500장 기준)',
  '지퍼백 0.05랑 0.1 두께 차이가 체감되나요?',
  '택배봉투 청보라색 실제로 보면 더 진한가요?',
  '세금계산서 발행 부탁드립니다 (사업자등록증 첨부)',
  '1,000장 이상 대량 구매 할인 문의드립니다',
  '진공포장지 가정용 실러에도 쓸 수 있나요?',
  '오늘 오후 2시 전 입금하면 당일 출고 되나요?',
  '식빵봉투 인쇄 없이 무지로만 판매하시나요?',
];
