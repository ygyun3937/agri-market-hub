# crawler/crawlers/weather.py
import os
import requests
from datetime import datetime, timedelta, date, timezone
import db

KST = timezone(timedelta(hours=9))

API_KEY = os.getenv("WEATHER_KEY", "")
BASE_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"
MID_URL = "http://apis.data.go.kr/1360000/MidFcstInfoService"

MID_LAND_CODES = {
    '11B10': '11B00000', '11B20': '11B00000', '11B21': '11B00000', '11B22': '11B00000',
    '11C10': '11C10000', '11C20': '11C20000',
    '11D10': '11D10000', '11D20': '11D20000',
    '11F10': '11F10000', '11F20': '11F20000',
    '11G00': '11G00000',
    '11H10': '11H10000', '11H11': '11H10000',
    '11H20': '11H20000', '11H21': '11H20000',
}

def _get_mid_base_time():
    now = datetime.now(KST)
    if now.hour >= 18:
        return now.strftime("%Y%m%d") + "1800"
    elif now.hour >= 6:
        return now.strftime("%Y%m%d") + "0600"
    else:
        return (now - timedelta(days=1)).strftime("%Y%m%d") + "1800"

REGIONS = [
    # 서울·인천·경기
    {"code": "11B10101", "nx": 60,  "ny": 127, "name": "서울"},
    {"code": "11B20201", "nx": 55,  "ny": 124, "name": "인천"},
    {"code": "11B20601", "nx": 60,  "ny": 121, "name": "수원"},
    {"code": "11B20701", "nx": 57,  "ny": 128, "name": "고양"},
    {"code": "11B20401", "nx": 62,  "ny": 123, "name": "성남"},
    {"code": "11B20501", "nx": 62,  "ny": 120, "name": "용인"},
    {"code": "11B20301", "nx": 61,  "ny": 130, "name": "의정부"},
    {"code": "11B20801", "nx": 88,  "ny": 121, "name": "부천"},
    {"code": "11B20901", "nx": 77,  "ny": 117, "name": "안산"},
    {"code": "11B21001", "nx": 87,  "ny": 124, "name": "안양"},
    {"code": "11B21101", "nx": 87,  "ny": 122, "name": "광명"},
    {"code": "11B21201", "nx": 65,  "ny": 112, "name": "평택"},
    {"code": "11B21301", "nx": 67,  "ny": 116, "name": "화성"},
    {"code": "11B21401", "nx": 56,  "ny": 130, "name": "파주"},
    {"code": "11B21501", "nx": 64,  "ny": 128, "name": "남양주"},
    {"code": "11B21601", "nx": 68,  "ny": 121, "name": "이천"},
    {"code": "11B21701", "nx": 71,  "ny": 121, "name": "여주"},
    {"code": "11B21801", "nx": 83,  "ny": 121, "name": "시흥"},
    {"code": "11B21901", "nx": 64,  "ny": 134, "name": "포천"},
    {"code": "11B22001", "nx": 54,  "ny": 123, "name": "김포"},
    {"code": "11B22101", "nx": 60,  "ny": 131, "name": "양주"},
    # 강원
    {"code": "11D10301", "nx": 73,  "ny": 134, "name": "춘천"},
    {"code": "11D10401", "nx": 76,  "ny": 122, "name": "원주"},
    {"code": "11D20401", "nx": 87,  "ny": 141, "name": "속초"},
    {"code": "11D20501", "nx": 92,  "ny": 131, "name": "강릉"},
    {"code": "11D20601", "nx": 97,  "ny": 127, "name": "동해"},
    {"code": "11D20701", "nx": 95,  "ny": 119, "name": "태백"},
    {"code": "11D20801", "nx": 98,  "ny": 124, "name": "삼척"},
    {"code": "11D10501", "nx": 86,  "ny": 119, "name": "영월"},
    {"code": "11D10601", "nx": 84,  "ny": 123, "name": "평창"},
    {"code": "11D10701", "nx": 75,  "ny": 130, "name": "홍천"},
    {"code": "11D10801", "nx": 65,  "ny": 139, "name": "철원"},
    {"code": "11D20901", "nx": 88,  "ny": 138, "name": "양양"},
    # 충청남북도·대전·세종
    {"code": "11C10101", "nx": 63,  "ny": 110, "name": "천안"},
    {"code": "11C10201", "nx": 51,  "ny": 110, "name": "서산"},
    {"code": "11C10301", "nx": 69,  "ny": 107, "name": "청주"},
    {"code": "11C20401", "nx": 67,  "ny": 100, "name": "대전"},
    {"code": "11C20404", "nx": 66,  "ny": 103, "name": "세종"},
    {"code": "11C10401", "nx": 76,  "ny": 114, "name": "충주"},
    {"code": "11C10501", "nx": 81,  "ny": 118, "name": "제천"},
    {"code": "11C10601", "nx": 71,  "ny": 114, "name": "음성"},
    {"code": "11C10701", "nx": 68,  "ny": 111, "name": "진천"},
    {"code": "11C20501", "nx": 63,  "ny": 102, "name": "공주"},
    {"code": "11C20601", "nx": 58,  "ny": 114, "name": "아산"},
    {"code": "11C20701", "nx": 54,  "ny": 100, "name": "보령"},
    {"code": "11C20801", "nx": 68,  "ny": 99,  "name": "논산"},
    {"code": "11C20901", "nx": 54,  "ny": 112, "name": "당진"},
    {"code": "11C21001", "nx": 55,  "ny": 106, "name": "홍성"},
    # 전라남북도·광주
    {"code": "11F10101", "nx": 56,  "ny": 92,  "name": "군산"},
    {"code": "11F10201", "nx": 63,  "ny": 89,  "name": "전주"},
    {"code": "11F10301", "nx": 60,  "ny": 91,  "name": "익산"},
    {"code": "11F20101", "nx": 56,  "ny": 77,  "name": "나주"},
    {"code": "11F20201", "nx": 73,  "ny": 73,  "name": "순천"},
    {"code": "11F20301", "nx": 73,  "ny": 66,  "name": "여수"},
    {"code": "11F20401", "nx": 58,  "ny": 74,  "name": "광주"},
    {"code": "11F20501", "nx": 50,  "ny": 67,  "name": "목포"},
    {"code": "11F20601", "nx": 51,  "ny": 74,  "name": "해남"},
    {"code": "11F10401", "nx": 68,  "ny": 83,  "name": "남원"},
    {"code": "11F10501", "nx": 58,  "ny": 84,  "name": "정읍"},
    {"code": "11F10601", "nx": 54,  "ny": 87,  "name": "김제"},
    {"code": "11F10701", "nx": 51,  "ny": 80,  "name": "고창"},
    {"code": "11F20701", "nx": 66,  "ny": 82,  "name": "담양"},
    {"code": "11F20801", "nx": 73,  "ny": 81,  "name": "구례"},
    {"code": "11F20901", "nx": 66,  "ny": 67,  "name": "고흥"},
    {"code": "11F21001", "nx": 65,  "ny": 79,  "name": "화순"},
    {"code": "11F21101", "nx": 58,  "ny": 73,  "name": "영암"},
    {"code": "11F21201", "nx": 66,  "ny": 63,  "name": "완도"},
    {"code": "11F21301", "nx": 56,  "ny": 70,  "name": "진도"},
    {"code": "11F21401", "nx": 62,  "ny": 68,  "name": "강진"},
    # 경상남북도·대구·울산·부산
    {"code": "11H10201", "nx": 91,  "ny": 106, "name": "안동"},
    {"code": "11H10501", "nx": 102, "ny": 94,  "name": "포항"},
    {"code": "11H10601", "nx": 100, "ny": 91,  "name": "경주"},
    {"code": "11H10701", "nx": 89,  "ny": 90,  "name": "대구"},
    {"code": "11H20101", "nx": 102, "ny": 84,  "name": "울산"},
    {"code": "11H20201", "nx": 98,  "ny": 76,  "name": "부산"},
    {"code": "11H20301", "nx": 91,  "ny": 77,  "name": "창원"},
    {"code": "11H20401", "nx": 81,  "ny": 75,  "name": "진주"},
    {"code": "11H20601", "nx": 95,  "ny": 77,  "name": "김해"},
    {"code": "11H10801", "nx": 84,  "ny": 96,  "name": "구미"},
    {"code": "11H10901", "nx": 89,  "ny": 109, "name": "영주"},
    {"code": "11H11001", "nx": 82,  "ny": 104, "name": "상주"},
    {"code": "11H11101", "nx": 91,  "ny": 90,  "name": "경산"},
    {"code": "11H11201", "nx": 80,  "ny": 97,  "name": "김천"},
    {"code": "11H11301", "nx": 81,  "ny": 107, "name": "문경"},
    {"code": "11H11401", "nx": 96,  "ny": 93,  "name": "영천"},
    {"code": "11H11501", "nx": 102, "ny": 115, "name": "울진"},
    {"code": "11H20701", "nx": 95,  "ny": 72,  "name": "거제"},
    {"code": "11H20801", "nx": 95,  "ny": 79,  "name": "양산"},
    {"code": "11H20901", "nx": 87,  "ny": 70,  "name": "통영"},
    {"code": "11H21001", "nx": 78,  "ny": 69,  "name": "사천"},
    {"code": "11H21101", "nx": 92,  "ny": 80,  "name": "밀양"},
    {"code": "11H21201", "nx": 78,  "ny": 81,  "name": "거창"},
    # 제주
    {"code": "11G00201", "nx": 52,  "ny": 38,  "name": "제주"},
    {"code": "11G00401", "nx": 52,  "ny": 33,  "name": "서귀포"},
]


def _get_base_time():
    """For getVilageFcst — 3-hourly slots in KST."""
    now = datetime.now(KST)
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


def _get_obs_base_time():
    """For getUltraSrtNcst — hourly in KST. Data released ~10 min after the hour."""
    now = datetime.now(KST)
    if now.minute < 10:
        now = now - timedelta(hours=1)
    return now.strftime("%Y%m%d"), now.strftime("%H") + "00"


def run_weather():
    base_date, base_time = _get_obs_base_time()
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


def _mid_wf_to_icon(wf):
    if not wf:
        return "sunny"
    if "비" in wf or "소나기" in wf:
        return "rainy"
    if "눈" in wf:
        return "snowy"
    if "구름" in wf:
        return "cloudy"
    return "sunny"


def run_forecast():
    base_date, base_time = _get_base_time()
    tmfc = _get_mid_base_time()
    today = date.today()

    for region in REGIONS:
        # ── 단기예보 (오늘~D+2) ──────────────────────────────────────────
        params = {
            "serviceKey": API_KEY,
            "pageNo": 1,
            "numOfRows": 1000,
            "dataType": "JSON",
            "base_date": base_date,
            "base_time": base_time,
            "nx": region["nx"],
            "ny": region["ny"],
        }
        try:
            resp = requests.get(f"{BASE_URL}/getVilageFcst", params=params, timeout=10)
            resp.raise_for_status()
            items = resp.json()["response"]["body"]["items"]["item"]
        except Exception:
            items = []

        # TMX/TMN appear only at specific fcstTime slots (1500/0600).
        # Extract them separately before grouping to avoid defaulting to 0.
        tmx_map: dict = {}
        tmn_map: dict = {}
        by_date: dict = {}
        for item in items:
            d = item["fcstDate"]
            cat = item["category"]
            val = item["fcstValue"]
            if cat == "TMX":
                tmx_map[d] = float(val)
            elif cat == "TMN":
                tmn_map[d] = float(val)
            else:
                by_date.setdefault(d, {})[cat] = val

        short_dates = set()
        for date_str in sorted(by_date.keys())[:3]:
            high = tmx_map.get(date_str)
            low = tmn_map.get(date_str)
            if high is None or low is None:
                continue  # skip dates missing temp data; mid-term will cover them
            short_dates.add(date_str)
            cats = by_date[date_str]
            forecast_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"
            pty = cats.get("PTY", "0")
            sky = cats.get("SKY", "1")
            if pty in ("1", "4"):    # 비, 소나기
                icon = "rainy"
            elif pty in ("2", "3"):  # 비/눈, 눈
                icon = "snowy"
            elif sky in ("3", "4"):  # 구름많음, 흐림
                icon = "cloudy"
            else:
                icon = "sunny"
            db.upsert_forecast(
                region_code=region["code"],
                forecast_date=forecast_date,
                icon=icon,
                high=high,
                low=low,
                rain_prob=int(float(cats.get("POP", 0))),
            )

        # ── 중기예보 (D+3, D+4) ──────────────────────────────────────────
        land_code = MID_LAND_CODES.get(region["code"][:5])
        if not land_code:
            continue
        try:
            land_resp = requests.get(f"{MID_URL}/getMidLandFcst",
                params={"serviceKey": API_KEY, "numOfRows": 1, "dataType": "JSON",
                        "regId": land_code, "tmFc": tmfc}, timeout=10)
            land_resp.raise_for_status()
            land_item = land_resp.json()["response"]["body"]["items"]["item"]
            if isinstance(land_item, list):
                land_item = land_item[0]

            ta_resp = requests.get(f"{MID_URL}/getMidTa",
                params={"serviceKey": API_KEY, "numOfRows": 1, "dataType": "JSON",
                        "regId": region["code"], "tmFc": tmfc}, timeout=10)
            ta_resp.raise_for_status()
            ta_item = ta_resp.json()["response"]["body"]["items"]["item"]
            if isinstance(ta_item, list):
                ta_item = ta_item[0]
        except Exception:
            continue

        base_dt = datetime.strptime(tmfc, "%Y%m%d%H%M")
        for offset in range(3, 7):
            target = today + timedelta(days=offset)
            target_str = target.strftime("%Y%m%d")
            if target_str in short_dates:
                continue
            day_num = (target - base_dt.date()).days
            if day_num < 3 or day_num > 10:
                continue
            wf = land_item.get(f"wf{day_num}Pm") or land_item.get(f"wf{day_num}Am", "")
            rnst = max(
                int(land_item.get(f"rnSt{day_num}Pm", 0) or 0),
                int(land_item.get(f"rnSt{day_num}Am", 0) or 0),
            )
            ta_min = float(ta_item.get(f"taMin{day_num}", 0) or 0)
            ta_max = float(ta_item.get(f"taMax{day_num}", 0) or 0)
            db.upsert_forecast(
                region_code=region["code"],
                forecast_date=target.strftime("%Y-%m-%d"),
                icon=_mid_wf_to_icon(wf),
                high=ta_max,
                low=ta_min,
                rain_prob=rnst,
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
