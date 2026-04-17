# crawler/crawlers/fuel.py
import os
import requests
import db

API_KEY = os.getenv("OPINET_KEY", "")
BASE_URL = "http://www.opinet.co.kr/api"


def run_fuel():
    params = {"code": API_KEY, "out": "json"}
    resp = requests.get(f"{BASE_URL}/avgAllPrice.do", params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    prices = data.get("RESULT", {}).get("OIL", [])
    for oil in prices:
        oil_code = oil.get("PRODCD", "")
        price = float(oil.get("PRICE", 0))
        if oil_code == "B027":  # 휘발유
            db.upsert_fuel_price(fuel_type="gasoline", price=price)
        elif oil_code == "D047":  # 경유
            db.upsert_fuel_price(fuel_type="diesel", price=price)
