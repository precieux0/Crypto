-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    balance DECIMAL(15, 6) DEFAULT 0,
    bonus_balance DECIMAL(15, 6) DEFAULT 0,
    total_earnings DECIMAL(15, 6) DEFAULT 0,
    referral_code VARCHAR(50) UNIQUE,
    referred_by INTEGER REFERENCES users(id),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_earnings (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    total_commission DECIMAL(15, 6) DEFAULT 0,
    referral_earnings DECIMAL(15, 6) DEFAULT 0,
    ad_revenue DECIMAL(15, 6) DEFAULT 0,
    game_commission DECIMAL(15, 6) DEFAULT 0,
    total_earnings DECIMAL(15, 6) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(15, 6),
    type VARCHAR(50),
    status VARCHAR(50),
    admin_commission DECIMAL(15, 6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(15, 6),
    method VARCHAR(50),
    details JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    admin_commission DECIMAL(15, 6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    game_type VARCHAR(100),
    bet_amount DECIMAL(15, 6),
    win_amount DECIMAL(15, 6),
    result VARCHAR(50),
    admin_commission DECIMAL(15, 6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ad_type VARCHAR(100),
    reward DECIMAL(10, 6),
    admin_commission DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);