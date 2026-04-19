# crawler/tests/test_weather.py
import pytest
import responses as resp_mock
from unittest.mock import patch
from crawlers.weather import run_weather, run_forecast


MOCK_WEATHER_RESPONSE = {
    "response": {
        "body": {
            "items": {
                "item": [
                    {"category": "T1H", "obsrValue": "18.5"},
                    {"category": "RN1", "obsrValue": "0.0"},
                    {"category": "REH", "obsrValue": "65"},
                    {"category": "WSD", "obsrValue": "2.3"},
                    {"category": "S06", "obsrValue": "0.0"},
                ]
            }
        }
    }
}


@resp_mock.activate
def test_run_weather_calls_db_upsert():
    resp_mock.add(
        resp_mock.GET,
        "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst",
        json=MOCK_WEATHER_RESPONSE,
        status=200,
    )

    with patch("crawlers.weather.db") as mock_db:
        run_weather()
        assert mock_db.upsert_weather.call_count == 36  # 36 regions
        first_call = mock_db.upsert_weather.call_args_list[0]
        assert first_call.kwargs["temp"] == 18.5
        assert first_call.kwargs["humidity"] == 65


@resp_mock.activate
def test_run_weather_handles_api_error():
    resp_mock.add(
        resp_mock.GET,
        "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst",
        status=500,
    )
    import requests
    with pytest.raises(requests.HTTPError):
        run_weather()
