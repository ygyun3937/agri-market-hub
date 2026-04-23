# crawler/db.py
import os
import psycopg2
from psycopg2.extras import execute_values


def get_conn():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "agrihub"),
        user=os.getenv("DB_USER", "agrihub"),
        password=os.getenv("DB_PASS", "agrihub_pass"),
    )


def upsert_weather(region_code, temp, rain, humidity, wind, snow):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO weather_data (region_code, temp, rain, humidity, wind, snow, collected_at)
               VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
            (region_code, temp, rain, humidity, wind, snow),
        )


def upsert_forecast(region_code, forecast_date, icon, high, low, rain_prob):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO weather_forecast (region_code, forecast_date, icon, high, low, rain_prob, collected_at)
               VALUES (%s, %s, %s, %s, %s, %s, NOW())
               ON CONFLICT (region_code, forecast_date) DO UPDATE
               SET icon=EXCLUDED.icon, high=EXCLUDED.high, low=EXCLUDED.low,
                   rain_prob=EXCLUDED.rain_prob, collected_at=NOW()""",
            (region_code, forecast_date, icon, high, low, rain_prob),
        )


def upsert_auction_price(item_code, market_code, price, volume, grade, date):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO auction_prices (item_code, market_code, price, volume, grade, date)
               VALUES (%s, %s, %s, %s, %s, %s)
               ON CONFLICT (item_code, market_code, date) DO UPDATE
               SET price=EXCLUDED.price, volume=EXCLUDED.volume, grade=EXCLUDED.grade""",
            (item_code, market_code, price, volume, grade, date),
        )


def insert_news(title, summary, url, tag, source, published_at):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO news_articles (title, summary, url, tag, source, published_at)
               VALUES (%s, %s, %s, %s, %s, %s)
               ON CONFLICT (url) DO NOTHING""",
            (title, summary, url, tag, source, published_at),
        )


def upsert_disaster_alert(alert_type, region, level, message, issued_at, expires_at):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO disaster_alerts (type, region, level, message, issued_at, expires_at)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (alert_type, region, level, message, issued_at, expires_at),
        )


def insert_pest_alert(region, item_name, severity, description):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO pest_alerts (region, item_name, severity, description, reported_at)
               VALUES (%s, %s, %s, %s, NOW())""",
            (region, item_name, severity, description),
        )


def upsert_fuel_price(fuel_type, price):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO fuel_prices (type, price, collected_at) VALUES (%s, %s, NOW())",
            (fuel_type, price),
        )


def upsert_market(code, name, region=None):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO markets (code, name, region)
               VALUES (%s, %s, %s)
               ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name""",
            (code, name, region),
        )

def upsert_auction_raw_batch(date_str, items):
    rows = []
    markets = {}
    for item in items:
        mcode = item.get("whsl_mrkt_cd", "").strip()
        mname = item.get("whsl_mrkt_nm", "").strip()
        icode = item.get("gds_mclsf_cd", "").strip()
        iname = item.get("gds_mclsf_nm", "").strip()
        category = item.get("gds_lclsf_nm", "").strip()
        variety = item.get("gds_sclsf_nm", "").strip()
        origin = item.get("plor_nm", "").strip()
        grade = ""  # katRealTime2 doesn't have grade field
        unit = item.get("unit_nm", "").strip()
        try:
            price = int(float(item.get("scsbd_prc", 0) or 0))
            volume = float(item.get("qty", 0) or 0)
        except (ValueError, TypeError):
            continue
        if not mcode or not icode or price <= 0:
            continue
        if mcode not in markets:
            markets[mcode] = mname
        rows.append((mcode, mname, icode, iname, category, variety, origin, grade, price, volume, unit, date_str))

    if not rows:
        return

    with get_conn() as conn, conn.cursor() as cur:
        for mcode, mname in markets.items():
            cur.execute(
                """INSERT INTO markets (code, name) VALUES (%s, %s)
                   ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name""",
                (mcode, mname)
            )
        execute_values(
            cur,
            """INSERT INTO auction_raw (market_code, market_name, item_code, item_name,
               category, variety, origin, grade, price, volume, unit, date)
               VALUES %s
               ON CONFLICT (market_code, item_code, variety, origin, grade, date)
               DO UPDATE SET price=EXCLUDED.price, volume=EXCLUDED.volume""",
            rows,
        )

def upsert_livestock_price(item_code, item_name, category, price, unit, date_str, origin="국내산"):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO livestock_prices (item_code, item_name, category, price, unit, date, origin)
               VALUES (%s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (item_code, origin, date)
               DO UPDATE SET price=EXCLUDED.price, item_name=EXCLUDED.item_name""",
            (item_code, item_name, category, price, unit, date_str, origin),
        )


def aggregate_daily_auction(date_str):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO daily_auction (item_code, item_name, category, date, avg_price, min_price, max_price, volume)
               SELECT item_code, MAX(item_name), MAX(category), date,
                      ROUND(AVG(price))::NUMERIC(10,0),
                      MIN(price), MAX(price),
                      SUM(volume)::NUMERIC(12,0)
               FROM auction_raw
               WHERE date = %s AND price > 0
               GROUP BY item_code, date
               ON CONFLICT (item_code, date)
               DO UPDATE SET avg_price=EXCLUDED.avg_price, min_price=EXCLUDED.min_price,
                             max_price=EXCLUDED.max_price, volume=EXCLUDED.volume,
                             item_name=EXCLUDED.item_name""",
            (date_str,),
        )
