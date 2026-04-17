# crawler/tests/test_kamis.py
import responses as resp_mock
from unittest.mock import patch
from crawlers.kamis import run_prices

MOCK_KAMIS_RESPONSE = {
    "data": {
        "item": [
            {"dpr1": "8,200", "kindname": "상품", "date": "2026-04-18"}
        ]
    }
}


@resp_mock.activate
def test_run_prices_calls_db_upsert():
    resp_mock.add(
        resp_mock.GET,
        "http://www.kamis.or.kr/service/price/xml.do",
        json=MOCK_KAMIS_RESPONSE,
        status=200,
    )
    with patch("crawlers.kamis.db") as mock_db:
        run_prices()
        assert mock_db.upsert_auction_price.called
        call_kwargs = mock_db.upsert_auction_price.call_args
        assert call_kwargs.kwargs["price"] == 8200.0
