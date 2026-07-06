import type { LogLine } from '../../core/utils';

// WARN 비율 10~15% 유지 (pick은 균등 분포 — 배열 내 개수가 곧 비율)
export const DEV_LOGS: LogLine[] = [
  ['lg-dim', '$ npm run build'],
  ['lg-info', 'vite v6.3.5 building for production...'],
  ['lg-ok', '✓ 231 modules transformed.'],
  ['lg-dim', 'dist/assets/index-Bx91kQml.js   142.33 kB │ gzip: 45.90 kB'],
  ['lg-ok', '✓ built in 3.42s'],
  ['lg-dim', '$ npx vitest run --reporter=dot'],
  ['lg-ok', ' ✓ tests/settlement.spec.ts  (14 tests) 812ms'],
  ['lg-ok', ' ✓ tests/refund-policy.spec.ts  (9 tests) 233ms'],
  ['lg-warn', ' ⚠ tests/legacy-coupon.spec.ts > 만료 쿠폰 재적용 — flaky, retried 2x'],
  ['lg-ok', 'Test Files  12 passed (12) · Tests  148 passed (148)'],
  ['lg-dim', '$ git pull --rebase origin main'],
  ['lg-info', 'Successfully rebased and updated refs/heads/feature/settle-batch-v2.'],
  ['lg-dim', '$ git status -sb'],
  ['lg-info', '## feature/settle-batch-v2...origin/feature/settle-batch-v2 [ahead 3]'],
  ['lg-ok', '✓ pre-commit hooks passed (eslint, prettier, commitlint) 2.1s'],
  ['lg-dim', '$ docker compose up -d --build payment-worker'],
  ['lg-info', '[+] Building 24.3s (14/17)  => [payment-worker internal] load build context'],
  ['lg-ok', ' ✔ Container payment-worker-1  Started  1.2s'],
  ['lg-dim', '$ kubectl logs -f deploy/settlement-api -n prod --tail=20'],
  ['lg-info', '{t} INFO  [http-nio-8080-exec-4] o.y.s.api.OrderController - GET /api/v3/orders?cursor=18442 200 (34ms)'],
  ['lg-info', '{t} INFO  [pool-2-thread-7] SettlementJob - partition 7/16 processed rows=18,442 skipped=0'],
  ['lg-warn', '{t} WARN  [pool-2-thread-3] RetryTemplate - PG timeout (attempt 1/3), backoff 2000ms'],
  ['lg-ok', '{t} INFO  [pool-2-thread-3] RetryTemplate - retry succeeded (attempt 2/3)'],
  ['lg-info', '{t} INFO  [kafka-coordinator] AbstractCoordinator - (Re-)joining group settlement-consumer-v2'],
  ['lg-ok', '{t} INFO  HikariPool-1 - Pool stats (total=20, active=3, idle=17, waiting=0)'],
  ['lg-err', '{t} ERROR [pool-2-thread-9] SettlementJob - duplicate key violates "settlement_pkey" (id=20260706-18443) — requeued'],
  ['lg-warn', '{t} WARN  CircuitBreaker coupon-service state=HALF_OPEN (failure rate 12.4%)'],
  ['lg-dim', '$ npm audit --omit=dev'],
  ['lg-ok', 'found 0 vulnerabilities'],
  ['lg-warn', 'npm warn deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142'],
  ['lg-dim', '$ tsc --noEmit'],
  ['lg-ok', '✓ type check passed (214 files, 0 errors)'],
];

// 해커타이퍼용: 실제로 동작할 법한 정산 배치 처리 스크립트
export const PY_SOURCE = `import csv
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

FEE_RATE = Decimal("0.033")  # PG 수수료 3.3%


@dataclass
class Order:
    order_id: str
    merchant_id: str
    amount: Decimal
    status: str


def load_orders(path: str) -> list[Order]:
    with open(path, newline="", encoding="utf-8") as f:
        return [
            Order(r["order_id"], r["merchant_id"], Decimal(r["amount"]), r["status"])
            for r in csv.DictReader(f)
        ]


def settle(orders: list[Order]) -> dict[str, Decimal]:
    payouts: dict[str, Decimal] = {}
    for o in orders:
        if o.status != "PAID":
            continue
        fee = (o.amount * FEE_RATE).quantize(Decimal("1"))
        payouts[o.merchant_id] = payouts.get(o.merchant_id, Decimal("0")) + o.amount - fee
    return payouts


def run(day: date | None = None) -> None:
    day = day or date.today() - timedelta(days=1)
    orders = load_orders(f"/data/orders/{day:%Y%m%d}.csv")
    for merchant, amount in sorted(settle(orders).items()):
        print(f"[{day}] {merchant}: {amount:,} KRW")


if __name__ == "__main__":
    run()
`;
