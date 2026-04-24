# crawler/crawlers/livestock.py
import os
import ssl
import requests
from requests.adapters import HTTPAdapter
import urllib3
from datetime import date
import logging
import db

urllib3.disable_warnings()
log = logging.getLogger(__name__)

API_KEY = os.getenv("KAMIS_KEY", "")
BASE_URL = "https://www.kamis.or.kr/service/price/xml.do"

MARKETS = {
    "1101": "서울 가락",
    "1102": "서울 강서",
    "2100": "부산 엄궁",
    "2200": "대구 북부",
    "2300": "광주 각화",
    "2400": "대전 오정",
    "3212": "구리",
    "3211": "인천 삼산",
}

LIVESTOCK_TARGETS = [
    # 소 - 축종별 경매가
    ("한우(거세)",  "C001", "한우 거세",  "두", "소"),
    ("한우(암소)",  "C002", "한우 암소",  "두", "소"),
    ("육우(거세)",  "C003", "육우 거세",  "두", "소"),
    ("젖소",        "C004", "젖소",       "두", "소"),
    ("한우(송아지)", "C005", "한우 송아지", "두", "소"),
    # 돼지 - 부위별 (원산지별 수집)
    ("돼지(삼겹살)", "L011", "돼지 삼겹살", "100g", "돼지"),
    ("돼지(목심)",   "L012", "돼지 목심",   "100g", "돼지"),
    ("돼지(앞다리)", "L013", "돼지 앞다리", "100g", "돼지"),
    # 닭·계란
    ("닭(육계)",  "L021", "닭(육계)",  "1kg",  "닭·계란"),
    ("계란(특란)", "L031", "계란 특란", "30개", "닭·계란"),
    ("계란(대란)", "L032", "계란 대란", "30개", "닭·계란"),
]


class _LegacySSL(HTTPAdapter):
    def init_poolmanager(self, *a, **kw):
        ctx = ssl.create_default_context()
        ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kw["ssl_context"] = ctx
        return super().init_poolmanager(*a, **kw)


_session = requests.Session()
_session.mount("https://", _LegacySSL())


def _fetch_category(cat_code, today, market_code="1101"):
    params = {
        "action": "dailySalesList",
        "p_cert_key": API_KEY,
        "p_cert_id": "1",
        "p_returntype": "json",
        "p_itemcategorycode": cat_code,
        "p_itemcode": "",
        "p_kindcode": "00",
        "p_productrankcode": "",
        "p_countrycode": market_code,
        "p_startday": today,
        "p_endday": today,
        "p_convert_kg_yn": "N",
    }
    resp = _session.get(BASE_URL, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return data.get("price") or []


def run_livestock():
    today = date.today().strftime("%Y-%m-%d")

    for market_code, market_name in MARKETS.items():
        all_items = []
        for cat in ["300", "500", "600"]:
            try:
                items = _fetch_category(cat, today, market_code)
                if items:
                    log.info(f"Livestock market={market_name} cat={cat} returned {len(items)} items")
                    all_items = items
                    break
            except Exception as e:
                log.warning(f"Livestock market={market_name} cat={cat} failed: {e}")

        if not all_items:
            log.warning(f"Livestock market={market_name}: no data for {today}")
            continue

        matched = 0
        for search, code, name, unit, cat in LIVESTOCK_TARGETS:
            seen_origins = set()
            for it in all_items:
                item_name = it.get("item_name", "")
                if search not in item_name:
                    continue
                raw_kind = (it.get("kind_name", "") or "").strip()
                origin = "수입산" if "수입" in raw_kind else "국내산"
                if origin in seen_origins:
                    continue
                seen_origins.add(origin)
                try:
                    price_str = str(it.get("dpr1", "0")).replace(",", "").strip()
                    price = float(price_str) if price_str else 0
                    if price <= 0:
                        continue
                    db.upsert_livestock_price(
                        item_code=code,
                        item_name=name,
                        category=cat,
                        price=price,
                        unit=unit,
                        date_str=today,
                        origin=origin,
                        market_code=market_code,
                    )
                    matched += 1
                    log.info(f"Livestock: {name} ({origin}) [{market_name}] = {price:,.0f}원/{unit}")
                except (ValueError, KeyError) as e:
                    log.warning(f"Livestock parse error {name} ({origin}) [{market_name}]: {e}")

        log.info(f"Livestock market={market_name}: {matched} prices saved for {today}")
