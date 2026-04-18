# crawler/crawlers/news.py
import os
import html
import requests
import re
from datetime import datetime
import db

CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

QUERIES = [
    ("농산물 경매가", "crop"),
    ("물류 운송", "logistics"),
    ("농식품부 정책", "policy"),
    ("병해충 발생", "pest"),
]


def run_news():
    headers = {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
    }
    for query, tag in QUERIES:
        params = {"query": query, "display": 10, "sort": "date"}
        resp = requests.get(
            "https://openapi.naver.com/v1/search/news.json",
            headers=headers,
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        for item in resp.json().get("items", []):
            title = html.unescape(re.sub(r"<[^>]+>", "", item.get("title", "")))
            summary = html.unescape(re.sub(r"<[^>]+>", "", item.get("description", "")))
            pub_date = item.get("pubDate", "")
            try:
                published_at = datetime.strptime(pub_date, "%a, %d %b %Y %H:%M:%S %z")
            except ValueError:
                published_at = None
            db.insert_news(
                title=title,
                summary=summary,
                url=item.get("link", ""),
                tag=tag,
                source=item.get("originallink", ""),
                published_at=published_at,
            )
