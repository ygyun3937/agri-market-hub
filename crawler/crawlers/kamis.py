# crawler/crawlers/kamis.py
import os
import ssl
import requests
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager
import urllib3
from datetime import date
import db

urllib3.disable_warnings()

API_KEY = os.getenv("KAMIS_KEY", "")
BASE_URL = "https://www.kamis.or.kr/service/price/xml.do"


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

ITEMS = [
    ("111", "배추"),
    ("112", "무"),
    ("211", "양파"),
    ("214", "당근"),
    ("215", "감자"),
    ("311", "사과"),
    ("312", "배"),
    ("411", "쌀"),
]
MARKET_CODE = "100110"  # 서울 가락시장


def run_prices():
    today = date.today().strftime("%Y-%m-%d")
    for item_code, item_name in ITEMS:
        params = {
            "action": "dailySalesList",
            "p_cert_key": API_KEY,
            "p_cert_id": "1",
            "p_returntype": "json",
            "p_itemcategorycode": item_code[:1] + "00",
            "p_itemcode": item_code,
            "p_kindcode": "00",
            "p_productrankcode": "04",
            "p_countrycode": MARKET_CODE,
            "p_startday": today,
            "p_endday": today,
            "p_convert_kg_yn": "N",
        }
        resp = _session.get(BASE_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("data", {}).get("item", [])
        for item in items:
            try:
                price_str = item.get("dpr1", "0").replace(",", "")
                price = float(price_str) if price_str else 0
                if price <= 0:
                    continue
                db.upsert_auction_price(
                    item_code=item_code,
                    market_code=MARKET_CODE,
                    price=price,
                    volume=None,
                    grade=item.get("kindname", ""),
                    date=today,
                )
            except (ValueError, KeyError):
                continue
