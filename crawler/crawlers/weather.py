# crawler/crawlers/weather.py
import os
import requests
import logging
from datetime import datetime, timedelta, timezone, date
import db

log = logging.getLogger(__name__)

API_KEY = os.getenv("OPENWEATHER_KEY", "")
BASE_URL = "https://api.openweathermap.org/data/2.5"

KST = timezone(timedelta(hours=9))

REGIONS = [
    # 서울·인천·경기
    {"code": "11B10101", "lat": 37.5665, "lon": 126.9780, "name": "서울"},
    {"code": "11B20201", "lat": 37.4563, "lon": 126.7052, "name": "인천"},
    {"code": "11B20601", "lat": 37.2636, "lon": 127.0286, "name": "수원"},
    {"code": "11B20701", "lat": 37.6584, "lon": 126.8320, "name": "고양"},
    {"code": "11B20401", "lat": 37.4200, "lon": 127.1267, "name": "성남"},
    {"code": "11B20501", "lat": 37.2411, "lon": 127.1776, "name": "용인"},
    {"code": "11B20301", "lat": 37.7382, "lon": 127.0456, "name": "의정부"},
    {"code": "11B20801", "lat": 37.5034, "lon": 126.7660, "name": "부천"},
    {"code": "11B20901", "lat": 37.3219, "lon": 126.8309, "name": "안산"},
    {"code": "11B21001", "lat": 37.3943, "lon": 126.9568, "name": "안양"},
    {"code": "11B21101", "lat": 37.4784, "lon": 126.8647, "name": "광명"},
    {"code": "11B21201", "lat": 36.9921, "lon": 127.1127, "name": "평택"},
    {"code": "11B21301", "lat": 37.1996, "lon": 126.8312, "name": "화성"},
    {"code": "11B21401", "lat": 37.7601, "lon": 126.7800, "name": "파주"},
    {"code": "11B21501", "lat": 37.6360, "lon": 127.2165, "name": "남양주"},
    {"code": "11B21601", "lat": 37.2791, "lon": 127.4428, "name": "이천"},
    {"code": "11B21701", "lat": 37.2982, "lon": 127.6376, "name": "여주"},
    {"code": "11B21801", "lat": 37.3799, "lon": 126.8030, "name": "시흥"},
    {"code": "11B21901", "lat": 37.8953, "lon": 127.2006, "name": "포천"},
    {"code": "11B22001", "lat": 37.6155, "lon": 126.7156, "name": "김포"},
    {"code": "11B22101", "lat": 37.7851, "lon": 127.0459, "name": "양주"},
    # 강원
    {"code": "11D10301", "lat": 37.8813, "lon": 127.7300, "name": "춘천"},
    {"code": "11D10401", "lat": 37.3422, "lon": 127.9201, "name": "원주"},
    {"code": "11D20401", "lat": 38.2071, "lon": 128.5918, "name": "속초"},
    {"code": "11D20501", "lat": 37.7519, "lon": 128.8761, "name": "강릉"},
    {"code": "11D20601", "lat": 37.5244, "lon": 129.1140, "name": "동해"},
    {"code": "11D20701", "lat": 37.1641, "lon": 128.9861, "name": "태백"},
    {"code": "11D20801", "lat": 37.4503, "lon": 129.1658, "name": "삼척"},
    {"code": "11D10501", "lat": 37.1839, "lon": 128.4614, "name": "영월"},
    {"code": "11D10601", "lat": 37.3719, "lon": 128.3904, "name": "평창"},
    {"code": "11D10701", "lat": 37.6966, "lon": 127.8878, "name": "홍천"},
    {"code": "11D10801", "lat": 38.1467, "lon": 127.3137, "name": "철원"},
    {"code": "11D20901", "lat": 38.0702, "lon": 128.6205, "name": "양양"},
    # 충청남북도·대전·세종
    {"code": "11C10101", "lat": 36.8151, "lon": 127.1139, "name": "천안"},
    {"code": "11C10201", "lat": 36.7845, "lon": 126.4500, "name": "서산"},
    {"code": "11C10301", "lat": 36.6424, "lon": 127.4890, "name": "청주"},
    {"code": "11C20401", "lat": 36.3504, "lon": 127.3845, "name": "대전"},
    {"code": "11C20404", "lat": 36.4804, "lon": 127.2890, "name": "세종"},
    {"code": "11C10401", "lat": 36.9910, "lon": 127.9259, "name": "충주"},
    {"code": "11C10501", "lat": 37.1326, "lon": 128.1911, "name": "제천"},
    {"code": "11C10601", "lat": 36.9847, "lon": 127.6904, "name": "음성"},
    {"code": "11C10701", "lat": 36.8554, "lon": 127.4337, "name": "진천"},
    {"code": "11C20501", "lat": 36.4467, "lon": 127.1192, "name": "공주"},
    {"code": "11C20601", "lat": 36.7898, "lon": 126.9935, "name": "아산"},
    {"code": "11C20701", "lat": 36.3330, "lon": 126.6128, "name": "보령"},
    {"code": "11C20801", "lat": 36.1868, "lon": 127.0987, "name": "논산"},
    {"code": "11C20901", "lat": 36.8897, "lon": 126.6278, "name": "당진"},
    {"code": "11C21001", "lat": 36.6011, "lon": 126.6679, "name": "홍성"},
    # 전라남북도·광주
    {"code": "11F10101", "lat": 35.9676, "lon": 126.7368, "name": "군산"},
    {"code": "11F10201", "lat": 35.8242, "lon": 127.1480, "name": "전주"},
    {"code": "11F10301", "lat": 35.9483, "lon": 126.9549, "name": "익산"},
    {"code": "11F20101", "lat": 35.0160, "lon": 126.7107, "name": "나주"},
    {"code": "11F20201", "lat": 34.9500, "lon": 127.4874, "name": "순천"},
    {"code": "11F20301", "lat": 34.7604, "lon": 127.6617, "name": "여수"},
    {"code": "11F20401", "lat": 35.1595, "lon": 126.8526, "name": "광주"},
    {"code": "11F20501", "lat": 34.8118, "lon": 126.3922, "name": "목포"},
    {"code": "11F20601", "lat": 34.5732, "lon": 126.5990, "name": "해남"},
    {"code": "11F10401", "lat": 35.4166, "lon": 127.3904, "name": "남원"},
    {"code": "11F10501", "lat": 35.5700, "lon": 126.8565, "name": "정읍"},
    {"code": "11F10601", "lat": 35.8035, "lon": 126.8808, "name": "김제"},
    {"code": "11F10701", "lat": 35.4263, "lon": 126.7024, "name": "고창"},
    {"code": "11F20701", "lat": 35.3213, "lon": 126.9880, "name": "담양"},
    {"code": "11F20801", "lat": 35.2020, "lon": 127.4633, "name": "구례"},
    {"code": "11F20901", "lat": 34.6048, "lon": 127.2755, "name": "고흥"},
    {"code": "11F21001", "lat": 35.0636, "lon": 126.9869, "name": "화순"},
    {"code": "11F21101", "lat": 34.8000, "lon": 126.6962, "name": "영암"},
    {"code": "11F21201", "lat": 34.3109, "lon": 126.7547, "name": "완도"},
    {"code": "11F21301", "lat": 34.4873, "lon": 126.2635, "name": "진도"},
    {"code": "11F21401", "lat": 34.6432, "lon": 126.7713, "name": "강진"},
    # 경상남북도·대구·울산·부산
    {"code": "11H10201", "lat": 36.5684, "lon": 128.7294, "name": "안동"},
    {"code": "11H10501", "lat": 36.0190, "lon": 129.3435, "name": "포항"},
    {"code": "11H10601", "lat": 35.8562, "lon": 129.2247, "name": "경주"},
    {"code": "11H10701", "lat": 35.8714, "lon": 128.6014, "name": "대구"},
    {"code": "11H20101", "lat": 35.5384, "lon": 129.3114, "name": "울산"},
    {"code": "11H20201", "lat": 35.1796, "lon": 129.0756, "name": "부산"},
    {"code": "11H20301", "lat": 35.2279, "lon": 128.6811, "name": "창원"},
    {"code": "11H20401", "lat": 35.1800, "lon": 128.1076, "name": "진주"},
    {"code": "11H20601", "lat": 35.2286, "lon": 128.8891, "name": "김해"},
    {"code": "11H10801", "lat": 36.1198, "lon": 128.3444, "name": "구미"},
    {"code": "11H10901", "lat": 36.8059, "lon": 128.6241, "name": "영주"},
    {"code": "11H11001", "lat": 36.4115, "lon": 128.1591, "name": "상주"},
    {"code": "11H11101", "lat": 35.8198, "lon": 128.7419, "name": "경산"},
    {"code": "11H11201", "lat": 36.1198, "lon": 128.1131, "name": "김천"},
    {"code": "11H11301", "lat": 36.5869, "lon": 128.1873, "name": "문경"},
    {"code": "11H11401", "lat": 35.9737, "lon": 128.9365, "name": "영천"},
    {"code": "11H11501", "lat": 36.9921, "lon": 129.4007, "name": "울진"},
    {"code": "11H20701", "lat": 34.8801, "lon": 128.6216, "name": "거제"},
    {"code": "11H20801", "lat": 35.3383, "lon": 129.0319, "name": "양산"},
    {"code": "11H20901", "lat": 34.8544, "lon": 128.4330, "name": "통영"},
    {"code": "11H21001", "lat": 35.0720, "lon": 128.0643, "name": "사천"},
    {"code": "11H21101", "lat": 35.4953, "lon": 128.7437, "name": "밀양"},
    {"code": "11H21201", "lat": 35.6867, "lon": 127.9081, "name": "거창"},
    # 제주
    {"code": "11G00201", "lat": 33.4996, "lon": 126.5312, "name": "제주"},
    {"code": "11G00401", "lat": 33.2541, "lon": 126.5600, "name": "서귀포"},
]


def _owm_icon(weather_id):
    if 200 <= weather_id < 600:  # thunderstorm, drizzle, rain
        return "rainy"
    if 600 <= weather_id < 700:  # snow
        return "snowy"
    if weather_id == 800:        # clear sky
        return "sunny"
    if 801 <= weather_id < 900:  # clouds
        return "cloudy"
    return "sunny"


def run_weather():
    for region in REGIONS:
        try:
            resp = requests.get(f"{BASE_URL}/weather", params={
                "lat": region["lat"],
                "lon": region["lon"],
                "appid": API_KEY,
                "units": "metric",
            }, timeout=10)
            resp.raise_for_status()
            d = resp.json()
            db.upsert_weather(
                region_code=region["code"],
                temp=float(d["main"]["temp"]),
                rain=float(d.get("rain", {}).get("1h", 0)),
                humidity=int(d["main"]["humidity"]),
                wind=float(d["wind"]["speed"]),
                snow=float(d.get("snow", {}).get("1h", 0)),
            )
            log.info(f"Weather: {region['name']} = {d['main']['temp']}°C")
        except Exception as e:
            log.warning(f"Weather fetch failed [{region['name']}]: {e}")


def run_forecast():
    today = date.today()
    for region in REGIONS:
        try:
            resp = requests.get(f"{BASE_URL}/forecast", params={
                "lat": region["lat"],
                "lon": region["lon"],
                "appid": API_KEY,
                "units": "metric",
                "cnt": 40,
            }, timeout=10)
            resp.raise_for_status()
            items = resp.json().get("list", [])
        except Exception as e:
            log.warning(f"Forecast fetch failed [{region['name']}]: {e}")
            continue

        daily: dict = {}
        for item in items:
            dt = datetime.fromtimestamp(item["dt"], tz=KST)
            day = dt.strftime("%Y-%m-%d")
            daily.setdefault(day, {"temps": [], "ids": [], "pops": []})
            daily[day]["temps"].append(item["main"]["temp"])
            daily[day]["ids"].append(item["weather"][0]["id"])
            daily[day]["pops"].append(item.get("pop", 0) * 100)

        for day, vals in sorted(daily.items()):
            if day < today.strftime("%Y-%m-%d"):
                continue
            icons = [_owm_icon(i) for i in vals["ids"]]
            icon = next((ic for ic in ("rainy", "snowy", "cloudy") if ic in icons), "sunny")
            db.upsert_forecast(
                region_code=region["code"],
                forecast_date=day,
                icon=icon,
                high=max(vals["temps"]),
                low=min(vals["temps"]),
                rain_prob=int(max(vals["pops"])),
            )
        log.info(f"Forecast: {region['name']} — {len(daily)} days saved")


def run_disaster_alerts():
    url = "http://apis.data.go.kr/1741000/DisasterMsg3/getDisasterMsg1List"
    params = {
        "serviceKey": os.getenv("WEATHER_KEY", ""),
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
