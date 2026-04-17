# crawler/main.py
import logging
import schedule
import time
from crawlers.weather import run_weather, run_forecast, run_disaster_alerts
from crawlers.kamis import run_prices
from crawlers.news import run_news
from crawlers.pest import run_pest
from crawlers.fuel import run_fuel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def safe(fn):
    def wrapper():
        try:
            fn()
        except Exception as e:
            log.error(f"{fn.__name__} failed: {e}")
    return wrapper


schedule.every(10).minutes.do(safe(run_disaster_alerts))
schedule.every(30).minutes.do(safe(run_prices))
schedule.every(30).minutes.do(safe(run_news))
schedule.every(1).hours.do(safe(run_weather))
schedule.every(3).hours.do(safe(run_forecast))
schedule.every(6).hours.do(safe(run_pest))
schedule.every().day.at("06:00").do(safe(run_fuel))

if __name__ == "__main__":
    log.info("Crawler starting — running all jobs once on boot")
    safe(run_weather)()
    safe(run_forecast)()
    safe(run_prices)()
    safe(run_fuel)()
    log.info("Initial run complete, entering schedule loop")
    while True:
        schedule.run_pending()
        time.sleep(30)
