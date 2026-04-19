# crawler/crawlers/weather.py
import os
import requests
from datetime import datetime, timedelta
import db

API_KEY = os.getenv("WEATHER_KEY", "")
BASE_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"

REGIONS = [
    {"code": "11B10101", "nx": 60,  "ny": 127, "name": "서울"},
    {"code": "11B20201", "nx": 55,  "ny": 124, "name": "인천"},
    {"code": "11B20601", "nx": 60,  "ny": 121, "name": "수원"},
    {"code": "11B20701", "nx": 57,  "ny": 128, "name": "고양"},
    {"code": "11B20401", "nx": 62,  "ny": 123, "name": "성남"},
    {"code": "11B20501", "nx": 62,  "ny": 120, "name": "용인"},
    {"code": "11B20301", "nx": 61,  "ny": 130, "name": "의정부"},
    {"code": "11D10301", "nx": 73,  "ny": 134, "name": "춘천"},
    {"code": "11D10401", "nx": 76,  "ny": 122, "name": "원주"},
    {"code": "11D20401", "nx": 87,  "ny": 141, "name": "속초"},
    {"code": "11D20501", "nx": 92,  "ny": 131, "name": "강릉"},
    {"code": "11D20601", "nx": 97,  "ny": 127, "name": "동해"},
    {"code": "11C10101", "nx": 63,  "ny": 110, "name": "천안"},
    {"code": "11C10201", "nx": 51,  "ny": 110, "name": "서산"},
    {"code": "11C10301", "nx": 69,  "ny": 107, "name": "청주"},
    {"code": "11C20401", "nx": 67,  "ny": 100, "name": "대전"},
    {"code": "11C20404", "nx": 66,  "ny": 103, "name": "세종"},
    {"code": "11F10101", "nx": 56,  "ny": 92,  "name": "군산"},
    {"code": "11F10201", "nx": 63,  "ny": 89,  "name": "전주"},
    {"code": "11F10301", "nx": 60,  "ny": 91,  "name": "익산"},
    {"code": "11F20101", "nx": 56,  "ny": 77,  "name": "나주"},
    {"code": "11F20201", "nx": 73,  "ny": 73,  "name": "순천"},
    {"code": "11F20301", "nx": 73,  "ny": 66,  "name": "여수"},
    {"code": "11F20401", "nx": 58,  "ny": 74,  "name": "광주"},
    {"code": "11F20501", "nx": 50,  "ny": 67,  "name": "목포"},
    {"code": "11H10201", "nx": 91,  "ny": 106, "name": "안동"},
    {"code": "11H10501", "nx": 102, "ny": 94,  "name": "포항"},
    {"code": "11H10601", "nx": 100, "ny": 91,  "name": "경주"},
    {"code": "11H10701", "nx": 89,  "ny": 90,  "name": "대구"},
    {"code": "11H20101", "nx": 102, "ny": 84,  "name": "울산"},
    {"code": "11H20201", "nx": 98,  "ny": 76,  "name": "부산"},
    {"code": "11H20301", "nx": 91,  "ny": 77,  "name": "창원"},
    {"code": "11H20401", "nx": 81,  "ny": 75,  "name": "진주"},
    {"code": "11H20601", "nx": 95,  "ny": 77,  "name": "김해"},
    {"code": "11G00201", "nx": 52,  "ny": 38,  "name": "제주"},
    {"code": "11G00401", "nx": 52,  "ny": 33,  "name": "서귀포"},
]


def _get_base_time():
    now = datetime.now()
    base_times = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"]
    base_date = now.strftime("%Y%m%d")
    current_hm = now.strftime("%H%M")
    selected = "2300"
    for bt in base_times:
        if current_hm >= bt:
            selected = bt
    if current_hm < "0200":
        base_date = (now - timedelta(days=1)).strftime("%Y%m%d")
        selected = "2300"
    return base_date, selected


def run_weather():
    base_date, base_time = _get_base_time()
    for region in REGIONS:
        params = {
            "serviceKey": API_KEY,
            "pageNo": 1,
            "numOfRows": 100,
            "dataType": "JSON",
            "base_date": base_date,
            "base_time": base_time,
            "nx": region["nx"],
            "ny": region["ny"],
        }
        resp = requests.get(f"{BASE_URL}/getUltraSrtNcst", params=params, timeout=10)
        resp.raise_for_status()
        items = resp.json()["response"]["body"]["items"]["item"]
        data = {item["category"]: item["obsrValue"] for item in items}
        db.upsert_weather(
            region_code=region["code"],
            temp=float(data.get("T1H", 0)),
            rain=float(data.get("RN1", 0)),
            humidity=int(float(data.get("REH", 0))),
            wind=float(data.get("WSD", 0)),
            snow=float(data.get("S06", 0)),
        )


def run_forecast():
    base_date, base_time = _get_base_time()
    for region in REGIONS:
        params = {
            "serviceKey": API_KEY,
            "pageNo": 1,
            "numOfRows": 300,
            "dataType": "JSON",
            "base_date": base_date,
            "base_time": base_time,
            "nx": region["nx"],
            "ny": region["ny"],
        }
        resp = requests.get(f"{BASE_URL}/getVilageFcst", params=params, timeout=10)
        resp.raise_for_status()
        items = resp.json()["response"]["body"]["items"]["item"]

        # Group by fcstDate
        by_date: dict = {}
        for item in items:
            d = item["fcstDate"]
            by_date.setdefault(d, {})[item["category"]] = item["fcstValue"]

        for date_str, cats in list(by_date.items())[:5]:
            forecast_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"
            sky = cats.get("SKY", "1")
            icon = {"1": "sunny", "3": "cloudy", "4": "rainy"}.get(sky, "sunny")
            db.upsert_forecast(
                region_code=region["code"],
                forecast_date=forecast_date,
                icon=icon,
                high=float(cats.get("TMX", 0)),
                low=float(cats.get("TMN", 0)),
                rain_prob=int(float(cats.get("POP", 0))),
            )


def run_disaster_alerts():
    url = "http://apis.data.go.kr/1741000/DisasterMsg3/getDisasterMsg1List"
    params = {
        "serviceKey": API_KEY,
        "pageNo": 1,
        "numOfRows": 10,
        "type": "json",
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    body = resp.json()
    items = body.get("DisasterMsg", [{}])[1].get("row", [])
    for item in items:
        db.upsert_disaster_alert(
            alert_type=item.get("cmd", ""),
            region=item.get("rcptn_rgn_nm", ""),
            level=item.get("emrg_step_nm", ""),
            message=item.get("msg_cn", ""),
            issued_at=item.get("crt_dt"),
            expires_at=None,
        )
