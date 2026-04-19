CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    google_id VARCHAR(255),
    google_refresh_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- migrate existing installs
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

CREATE TABLE IF NOT EXISTS user_settings (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    watch_regions TEXT[] DEFAULT '{}',
    alert_thresholds JSONB DEFAULT '{"priceDropPercent":5}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watch_items (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    market_code VARCHAR(50),
    UNIQUE(user_id, item_code)
);

CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(20) NOT NULL,
    temp NUMERIC(5,1),
    rain NUMERIC(6,1),
    humidity INT,
    wind NUMERIC(5,1),
    snow NUMERIC(6,1),
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_forecast (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(20) NOT NULL,
    forecast_date DATE NOT NULL,
    icon VARCHAR(20),
    high NUMERIC(5,1),
    low NUMERIC(5,1),
    rain_prob INT,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(region_code, forecast_date)
);

CREATE TABLE IF NOT EXISTS auction_prices (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL,
    market_code VARCHAR(50) NOT NULL,
    price NUMERIC(10,0) NOT NULL,
    volume NUMERIC(10,0),
    grade VARCHAR(20),
    date DATE NOT NULL,
    UNIQUE(item_code, market_code, date)
);

CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT UNIQUE NOT NULL,
    tag VARCHAR(50),
    source VARCHAR(100),
    published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pest_alerts (
    id SERIAL PRIMARY KEY,
    region VARCHAR(100),
    item_name VARCHAR(100),
    severity VARCHAR(20),
    description TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disaster_alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),
    region TEXT,
    level VARCHAR(20),
    message TEXT,
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fuel_prices (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    price NUMERIC(7,1) NOT NULL,
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    date DATE NOT NULL,
    memo TEXT,
    gcal_event_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    body TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_auction_prices_date ON auction_prices(date DESC);
CREATE INDEX idx_news_articles_tag ON news_articles(tag);
CREATE INDEX idx_disaster_alerts_expires ON disaster_alerts(expires_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
