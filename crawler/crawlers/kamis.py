# crawler/crawlers/kamis.py
import os
import ssl
import requests
from requests.adapters import HTTPAdapter
import urllib3
from datetime import date
import db

urllib3.disable_warnings()

API_KEY = os.getenv("KAMIS_KEY", "")
BASE_URL = "https://www.kamis.or.kr/service/price/xml.do"
MARKET_CODE = "100110"

# Map our internal code → (KAMIS productno, display name, unit)
# productno comes from dailySalesList category=100 (wholesale 도매 prices)
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
    params = {
        "action": "dailySalesList",
        "p_cert_key": API_KEY,
        "p_cert_id": "1",
        "p_returntype": "json",
        "p_itemcategorycode": "100",
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
    all_items = data.get("price") or []
    if not all_items:
        return

    # Index by productno for fast lookup
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
                market_code=MARKET_CODE,
                price=price,
                volume=None,
                grade=display_name,
                date=today,
            )
        except (ValueError, KeyError):
            continue
