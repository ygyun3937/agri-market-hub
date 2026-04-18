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
