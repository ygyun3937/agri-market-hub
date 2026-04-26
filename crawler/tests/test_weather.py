# crawler/tests/test_weather.py
import responses as resp_mock
from unittest.mock import patch
from crawlers.weather import run_weather

OWM_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

MOCK_WEATHER_RESPONSE = {
    "main": {"temp": 18.5, "humidity": 65},
    "wind": {"speed": 2.3},
    "weather": [{"id": 800}],
}


@resp_mock.activate
def test_run_weather_calls_db_upsert():
    resp_mock.add(resp_mock.GET, OWM_WEATHER_URL, json=MOCK_WEATHER_RESPONSE, status=200)

    with patch("crawlers.weather.db") as mock_db:
        run_weather()
        assert mock_db.upsert_weather.call_count == 94
        first_call = mock_db.upsert_weather.call_args_list[0]
        assert first_call.kwargs["temp"] == 18.5
        assert first_call.kwargs["humidity"] == 65


@resp_mock.activate
def test_run_weather_handles_api_error():
    resp_mock.add(resp_mock.GET, OWM_WEATHER_URL, status=500)

    with patch("crawlers.weather.db") as mock_db:
        run_weather()  # should not raise — errors are caught per region
        assert mock_db.upsert_weather.call_count == 0
