# crawler/crawlers/pest.py
import os
import requests
import db

API_KEY = os.getenv("PEST_KEY", "")


def run_pest():
    url = "http://ncpms.rda.go.kr/npmsAPI/service"
    params = {
        "serviceKey": API_KEY,
        "apiKey": API_KEY,
        "serviceCode": "SVC20",
        "numOfRows": 20,
        "pageNo": 1,
        "format": "json",
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    items = data.get("service", {}).get("list", [])
    for item in items:
        db.insert_pest_alert(
            region=item.get("siNm", ""),
            item_name=item.get("cropNm", ""),
            severity=item.get("insectNm", ""),
            description=item.get("remark", ""),
        )
