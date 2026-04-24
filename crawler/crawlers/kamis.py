# crawler/crawlers/kamis.py
import os
import ssl
import logging
import requests
from requests.adapters import HTTPAdapter
import urllib3
from datetime import date
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

# Map our internal code → (KAMIS productno, display name, unit)
ITEM_MAP = {
    "111": ("34",  "배추/월동",   "10kg"),
    "112": ("70",  "무/월동",    "20kg"),
    "211": ("117", "양파",       "15kg"),
    "214": ("74",  "당근/무세척", "20kg"),
    "215": ("24",  "감자/수미",   "20kg"),
    "311": ("198", "사과/후지",   "10kg"),
    "312": ("204", "배/신고",    "15kg"),
    "411": ("1",   "쌀",        "20kg"),
}


class _LegacySSL(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context()
        ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)


_session = requests.Session()
_session.mount("https://", _LegacySSL())


def run_prices():
    today = date.today().strftime("%Y-%m-%d")

    for market_code, market_name in MARKETS.items():
        params = {
            "action": "dailySalesList",
            "p_cert_key": API_KEY,
            "p_cert_id": "1",
            "p_returntype": "json",
            "p_itemcategorycode": "100",
            "p_itemcode": "",
            "p_kindcode": "00",
            "p_productrankcode": "",
            "p_countrycode": market_code,
            "p_startday": today,
            "p_endday": today,
            "p_convert_kg_yn": "N",
        }
        try:
            resp = _session.get(BASE_URL, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            all_items = data.get("price") or []
        except Exception as e:
            log.warning(f"Agri market={market_name}({market_code}) fetch failed: {e}")
            continue

        if not all_items:
            log.info(f"Agri market={market_name}: no data for {today}")
            continue

        by_productno = {str(it.get("productno", "")): it for it in all_items}

        for item_code, (productno, display_name, unit) in ITEM_MAP.items():
            row = by_productno.get(productno)
            if not row:
                continue
            try:
                price_str = row.get("dpr1", "0").replace(",", "")
                price = float(price_str) if price_str else 0
                if price <= 0:
                    continue
                db.upsert_auction_price(
                    item_code=item_code,
                    market_code=market_code,
                    price=price,
                    volume=None,
                    grade=display_name,
                    date=today,
                )
                log.info(f"Agri: {display_name} [{market_name}] = {price:,.0f}원/{unit}")
            except (ValueError, KeyError):
                continue
