# crawler/tests/test_fuel.py
import responses as resp_mock
from unittest.mock import patch
from crawlers.fuel import run_fuel

MOCK_OPINET_RESPONSE = {
    "RESULT": {
        "OIL": [
            {"PRODCD": "B027", "PRICE": "1823.5"},
            {"PRODCD": "D047", "PRICE": "1654.2"},
        ]
    }
}


@resp_mock.activate
def test_run_fuel_upserts_gasoline_and_diesel():
    resp_mock.add(
        resp_mock.GET,
        "http://www.opinet.co.kr/api/avgAllPrice.do",
        json=MOCK_OPINET_RESPONSE,
        status=200,
    )
    with patch("crawlers.fuel.db") as mock_db:
        run_fuel()
        calls = {c.kwargs["fuel_type"]: c.kwargs["price"]
                 for c in mock_db.upsert_fuel_price.call_args_list}
        assert calls["gasoline"] == 1823.5
        assert calls["diesel"] == 1654.2
