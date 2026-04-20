# crawler/crawlers/pest.py
import os
import logging
import requests
import db

log = logging.getLogger(__name__)
API_KEY = os.getenv("PEST_KEY", "")


def run_pest():
    if not API_KEY:
        log.warning("PEST_KEY not set, skipping pest crawler")
        return

    url = "http://ncpms.rda.go.kr/npmsAPI/service"
    params = {
        "apiKey": API_KEY,
        "serviceCode": "SVC20",
        "numOfRows": 20,
        "pageNo": 1,
        "format": "json",
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        log.error(f"Pest API request failed: {e}")
        return

    try:
        data = resp.json()
    except Exception:
        log.error(f"Pest API non-JSON response: {resp.text[:200]}")
        return

    # NCPMS API response can vary — try multiple paths
    items = (
        data.get("service", {}).get("list")
        or data.get("response", {}).get("body", {}).get("items", {}).get("item")
        or data.get("list")
        or []
    )
    if isinstance(items, dict):
        items = [items]

    log.info(f"Pest API returned {len(items)} items")
    if not items:
        log.warning(f"Pest API empty response keys: {list(data.keys())}")
        return

    for item in items:
        db.insert_pest_alert(
            region=item.get("siNm") or item.get("region", ""),
            item_name=item.get("cropNm") or item.get("itemName", ""),
            severity=item.get("insectNm") or item.get("pestNm") or item.get("severity", ""),
            description=item.get("remark") or item.get("description", ""),
        )
