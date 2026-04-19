# crawler/crawlers/auction.py
import os
import requests
import logging
from datetime import date, timedelta
import db

log = logging.getLogger(__name__)
API_KEY = os.getenv("PUBLIC_DATA_API_KEY", "")
BASE_URL = "https://apis.data.go.kr/B552845/katRealTime2/trades2"

def fetch_page(sale_date: str, page: int = 1, num_rows: int = 1000):
    params = {
        "serviceKey": API_KEY,
        "cond[trd_clcln_ymd::EQ]": sale_date,
        "pageNo": str(page),
        "numOfRows": str(num_rows),
        "returnType": "json",
    }
    resp = requests.get(BASE_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    header = data.get("response", {}).get("header", {})
    if header.get("resultCode") not in ("0", "00"):
        raise Exception(f"API error: {header}")
    body = data.get("response", {}).get("body", {})
    raw_items = body.get("items", {})
    items = raw_items.get("item", []) if isinstance(raw_items, dict) else []
    total = int(body.get("totalCount", 0))
    return items, total

def run_auction():
    if not API_KEY:
        log.warning("PUBLIC_DATA_API_KEY not set, skipping auction crawl")
        return
    target = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
    log.info(f"Fetching auction data for {target}")
    page, num_rows = 1, 1000
    total_items = 0
    while True:
        items, total = fetch_page(target, page, num_rows)
        if not items:
            break
        db.upsert_auction_raw_batch(target, items)
        total_items += len(items)
        log.info(f"  page {page}: {len(items)} items (total={total})")
        if total_items >= total:
            break
        page += 1
    db.aggregate_daily_auction(target)
    log.info(f"Auction crawl done: {total_items} records for {target}")
