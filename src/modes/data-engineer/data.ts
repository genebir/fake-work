import type { LogLine } from '../../core/utils';

export const DE_LOGS: LogLine[] = [
  ['lg-dim', '$ airflow dags trigger dw_daily_batch --logical-date 2026-07-06'],
  ['lg-info', '[{t}] {taskinstance.py:1157} INFO - Executing <Task(PythonOperator): extract_orders> on 2026-07-06'],
  ['lg-ok', '[{t}] {python.py:183} INFO - Done. Returned value was: 1,842,113 rows'],
  ['lg-info', '[{t}] {taskinstance.py:1400} INFO - Marking task as SUCCESS. dag_id=dw_daily_batch, task_id=extract_orders'],
  ['lg-warn', '[{t}] {taskinstance.py:1512} WARNING - Sensor wait_for_upstream_crm poke #14 — upstream not ready, rescheduling'],
  ['lg-info', '{t} INFO  MySQL|dw|binlog  Processed 12,441 events from binlog mysql-bin.004217, pos=88213377 [io.debezium.connector.mysql]'],
  ['lg-info', '{t} INFO  MySQL|dw|snapshot  Snapshot step 7 — scanning table orders (1,842,113 of est. 1,845,000 rows)'],
  ['lg-dim', '$ kafka-consumer-groups --bootstrap-server kafka-1:9092 --describe --group dw-sink-consumer'],
  ['lg-warn', 'GROUP dw-sink-consumer  TOPIC cdc.orders  PARTITION 3  LAG 12,441 (increasing)'],
  ['lg-ok', 'GROUP dw-sink-consumer  TOPIC cdc.orders  PARTITION 3  LAG 0 (caught up)'],
  ['lg-dim', '$ dbt run --select tag:daily --target prod'],
  ['lg-info', '{t} | 12 of 48 START sql incremental model dw.fct_orders ................. [RUN]'],
  ['lg-ok', '{t} | 12 of 48 OK created sql incremental model dw.fct_orders ............ [INSERT 1,842,113 in 42.3s]'],
  ['lg-info', '{t} | 27 of 48 START sql table model dw.dim_merchant ..................... [RUN]'],
  ['lg-ok', '{t} | 27 of 48 OK created sql table model dw.dim_merchant ................ [SELECT 88,214 in 6.1s]'],
  ['lg-ok', '{t} | 41 of 48 PASS not_null_fct_orders_order_id ......................... [PASS in 1.8s]'],
  ['lg-warn', '{t} | 44 of 48 WARN 12 accepted_range_fct_orders_amount .................. [WARN 12 in 2.1s]'],
  ['lg-ok', '{t} | Finished running 31 incremental models, 9 table models, 8 tests in 481.22s — Completed successfully'],
  ['lg-info', '{t} INFO  TaskSetManager: Finished task 118.0 in stage 24.0 (TID 4211) in 8213 ms on exec-7 (118/200)'],
  ['lg-ok', '{t} INFO  DAGScheduler: Stage 24 (parquet at S3Sink.scala:88) finished in 94.211 s'],
  ['lg-warn', '{t} WARN  ExecutorAllocationManager: Requesting 8 new executors (task backlog: 42)'],
  ['lg-ok', '{t} INFO  S3AFileSystem - Committed s3://yeolil-dw/curated/orders/dt=2026-07-05/part-00118.snappy.parquet (128.4 MB)'],
  ['lg-info', '{t} vkconfig microbatch orders_mb  status=RUNNING  end_offset=88213377  parsed=1,842,113  rejected=0'],
  ['lg-ok', '{t} vkconfig microbatch orders_mb  COMMIT epoch=20260706T02  duration=8.4s'],
  ['lg-err', '{t} ERROR AirflowTaskTimeout after 3600s — wait_for_upstream_crm failed (try 2 of 4), retrying in 300s'],
  ['lg-ok', '[quality] row_count src.orders=1,842,113 vs dw.fct_orders=1,842,113 ... diff=0 ✓'],
  ['lg-ok', '[quality] sum(amount) src=8,844,213,900 vs dw=8,844,213,900 ... diff=0 ✓'],
  ['lg-ok', '[quality] null_rate(merchant_id)=0.0000% (threshold 0.01%) ✓'],
  ['lg-info', '[{t}] {taskinstance.py:1157} INFO - Executing <Task(BashOperator): vacuum_analyze_dw> on 2026-07-06'],
  ['lg-dim', '$ aws s3 ls s3://yeolil-dw/curated/orders/dt=2026-07-05/ --summarize | tail -2'],
  ['lg-dim', 'Total Objects: 200 / Total Size: 24.1 GiB'],
];

// 해커타이퍼용: PySpark 일배치 잡
export const SPARK_SOURCE = `from datetime import date, timedelta

from pyspark.sql import SparkSession, functions as F

RAW = "s3://yeolil-dw/raw/orders"
CURATED = "s3://yeolil-dw/curated/orders"


def build_session() -> SparkSession:
    return (
        SparkSession.builder.appName("dw_daily_batch.orders")
        .config("spark.sql.shuffle.partitions", "200")
        .config("spark.sql.sources.partitionOverwriteMode", "dynamic")
        .getOrCreate()
    )


def transform(spark: SparkSession, dt: str):
    orders = spark.read.parquet(f"{RAW}/dt={dt}")
    return (
        orders.filter(F.col("status") == "PAID")
        .withColumn("fee", F.round(F.col("amount") * F.lit(0.033)))
        .withColumn("net_amount", F.col("amount") - F.col("fee"))
        .groupBy("merchant_id", "dt")
        .agg(
            F.count("order_id").alias("order_cnt"),
            F.sum("net_amount").alias("payout_krw"),
        )
    )


def main() -> None:
    dt = (date.today() - timedelta(days=1)).isoformat()
    spark = build_session()
    df = transform(spark, dt)
    df.repartition(1).write.mode("overwrite").partitionBy("dt").parquet(CURATED)
    print(f"[{dt}] wrote {df.count():,} merchant rows")


if __name__ == "__main__":
    main()
`;
