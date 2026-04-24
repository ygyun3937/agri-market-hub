# crawler/crawlers/livestock.py
# KAMIS API로 축산물 도매 기준가 수집 (category 300)
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

# (검색어, internal code, 표시이름, 단위, 카테고리)
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


def _fetch_category(cat_code, today):
    params = {
        "action": "dailySalesList",
        "p_cert_key": API_KEY,
        "p_cert_id": "1",
        "p_returntype": "json",
        "p_itemcategorycode": cat_code,
        "p_itemcode": "",
        "p_kindcode": "00",
        "p_productrankcode": "",
        "p_countrycode": "1101",
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
    all_items = []

    # KAMIS 축산물 카테고리 후보: 300, 500, 600 순서로 시도
    for cat in ["300", "500", "600"]:
        try:
            items = _fetch_category(cat, today)
            if items:
                log.info(f"Livestock: category={cat} returned {len(items)} items")
                all_items = items
                break
        except Exception as e:
            log.warning(f"Livestock category={cat} failed: {e}")

    if not all_items:
        log.warning("Livestock: no data returned from any category")
        return

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
                )
                matched += 1
                log.info(f"Livestock: {name} ({origin}) = {price:,.0f}원/{unit}")
            except (ValueError, KeyError) as e:
                log.warning(f"Livestock parse error for {name} ({origin}): {e}")

    log.info(f"Livestock: {matched} prices saved for {today}")
